"""
Email Agent - Automated Resume Processing System (DOS-Protected)
Receives emails, analyzes resumes, sends automated responses
Includes: rate limiting, file size limits, sender blocking, attachment validation
"""

import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import os
import time
import hashlib
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Optional, List
from pathlib import Path
import tempfile
import io
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")


# Email configuration
EMAIL_CONFIG = {
    "IMAP_SERVER": os.getenv("IMAP_SERVER"),
    "SMTP_SERVER": os.getenv("SMTP_SERVER"),
    "SMTP_PORT": int(os.getenv("SMTP_PORT", 587)),
    "EMAIL_ADDRESS": os.getenv("EMAIL_ADDRESS"),
    "EMAIL_PASSWORD": os.getenv("EMAIL_PASSWORD"),
    "CHECK_INTERVAL": int(os.getenv("CHECK_INTERVAL", 60)),
    "ATS_THRESHOLD": 70,
}

# ─── DOS Protection Config ────────────────────────────────────────────────────
SECURITY_CONFIG = {
    # Rate limiting — max emails processed per sender per window
    "RATE_LIMIT_MAX": 3,               # max 3 emails per sender
    "RATE_LIMIT_WINDOW_MINUTES": 60,   # ...per 60 minutes
    
    # File size limit — reject attachments larger than this
    "MAX_FILE_SIZE_MB": 5,             # 5 MB max per attachment
    
    # Max attachments to process per email (ignore the rest)
    "MAX_ATTACHMENTS_PER_EMAIL": 2,
    
    # Max emails to process in a single inbox check cycle
    "MAX_EMAILS_PER_CYCLE": 20,
    
    # Max size of entire email (headers + body + attachments)
    "MAX_EMAIL_SIZE_MB": 10,
    
    # Cooldown after processing a heavy batch (seconds)
    "BATCH_COOLDOWN_SECONDS": 5,
    
    # Blocked senders — add any known spammers here
    "BLOCKED_SENDERS": set(),
    
    # Allowed file extensions (whitelist)
    "ALLOWED_EXTENSIONS": {"pdf", "docx", "txt"},
}

class EmailAgent:
    """Automated email processing agent for resume analysis"""
    
    def __init__(self, analyzer_function):
        """
        Initialize email agent
        
        Args:
            analyzer_function: Function to analyze resume
        """
        self.email_address = EMAIL_CONFIG["EMAIL_ADDRESS"]
        self.email_password = EMAIL_CONFIG["EMAIL_PASSWORD"]
        self.imap_server = EMAIL_CONFIG["IMAP_SERVER"]
        self.smtp_server = EMAIL_CONFIG["SMTP_SERVER"]
        self.smtp_port = EMAIL_CONFIG["SMTP_PORT"]
        self.analyze_resume = analyzer_function
        self.processed_emails = set()       # Track processed email IDs
        self.log = []                        # Activity log visible via /agent-log endpoint

        # DOS protection state
        self._rate_tracker: Dict[str, List[datetime]] = defaultdict(list)  # sender -> [timestamps]
        self._blocked_senders: set = set(SECURITY_CONFIG["BLOCKED_SENDERS"])
        self._rejected_count: int = 0        # total emails rejected by security
        self._processed_count: int = 0       # total emails successfully processed

    def _log(self, message: str):
        """Append a timestamped entry to the log (keeps last 50)"""
        entry = f"[{datetime.now().strftime('%H:%M:%S')}] {message}"
        self.log.append(entry)
        if len(self.log) > 50:
            self.log.pop(0)
        print(entry)

    # ─── DOS Protection Methods ──────────────────────────────────────────────────

    def _is_rate_limited(self, sender_email: str) -> bool:
        """Check if a sender has exceeded the rate limit."""
        now = datetime.now()
        window = timedelta(minutes=SECURITY_CONFIG["RATE_LIMIT_WINDOW_MINUTES"])
        max_emails = SECURITY_CONFIG["RATE_LIMIT_MAX"]

        # Remove timestamps outside the current window
        self._rate_tracker[sender_email] = [
            ts for ts in self._rate_tracker[sender_email]
            if now - ts < window
        ]

        count = len(self._rate_tracker[sender_email])
        if count >= max_emails:
            self._log(
                f"🚫 RATE LIMITED — {sender_email} sent {count} emails in "
                f"{SECURITY_CONFIG['RATE_LIMIT_WINDOW_MINUTES']} min (max {max_emails})"
            )
            return True
        return False

    def _record_sender(self, sender_email: str):
        """Record a processed email for rate limiting purposes."""
        self._rate_tracker[sender_email].append(datetime.now())

    def _is_blocked(self, sender_email: str) -> bool:
        """Check if a sender is on the blocklist."""
        if sender_email.lower() in {s.lower() for s in self._blocked_senders}:
            self._log(f"🚫 BLOCKED SENDER — {sender_email} is on the blocklist")
            return True
        return False

    def block_sender(self, sender_email: str):
        """Manually block a sender (callable from API if you add an endpoint)."""
        self._blocked_senders.add(sender_email.lower())
        self._log(f"🔒 Sender manually blocked: {sender_email}")

    def unblock_sender(self, sender_email: str):
        """Remove a sender from the blocklist."""
        self._blocked_senders.discard(sender_email.lower())
        self._log(f"🔓 Sender unblocked: {sender_email}")

    def _validate_attachment(self, filename: str, content: bytes) -> tuple[bool, str]:
        """
        Validate a file attachment before processing.
        Returns (is_valid, rejection_reason).
        """
        # 1. Extension whitelist check
        ext = filename.lower().split(".")[-1]
        if ext not in SECURITY_CONFIG["ALLOWED_EXTENSIONS"]:
            return False, f"extension .{ext} not allowed (only pdf, docx, txt)"

        # 2. File size check
        max_bytes = SECURITY_CONFIG["MAX_FILE_SIZE_MB"] * 1024 * 1024
        if len(content) > max_bytes:
            size_mb = len(content) / (1024 * 1024)
            return False, f"file too large ({size_mb:.1f}MB, max {SECURITY_CONFIG['MAX_FILE_SIZE_MB']}MB)"

        # 3. Magic bytes check — verify file is actually what it claims to be
        if ext == "pdf" and not content.startswith(b"%PDF"):
            return False, "file claims to be PDF but has wrong header (possible disguised file)"

        if ext == "docx" and not content.startswith(b"PK"):
            return False, "file claims to be DOCX but has wrong header (possible disguised file)"

        # 4. Empty file check
        if len(content) < 100:
            return False, "file is too small to be a valid resume"

        return True, "ok"

    def _check_email_size(self, msg_data_bytes: bytes) -> tuple[bool, str]:
        """Reject emails that are too large overall."""
        max_bytes = SECURITY_CONFIG["MAX_EMAIL_SIZE_MB"] * 1024 * 1024
        size_mb = len(msg_data_bytes) / (1024 * 1024)
        if len(msg_data_bytes) > max_bytes:
            return False, f"email too large ({size_mb:.1f}MB, max {SECURITY_CONFIG['MAX_EMAIL_SIZE_MB']}MB)"
        return True, "ok"

    def get_security_stats(self) -> Dict:
        """Return current security stats — used by /email-agent-status endpoint."""
        return {
            "blocked_senders": list(self._blocked_senders),
            "blocked_sender_count": len(self._blocked_senders),
            "rejected_by_security": self._rejected_count,
            "successfully_processed": self._processed_count,
            "rate_limit_config": {
                "max_emails_per_sender": SECURITY_CONFIG["RATE_LIMIT_MAX"],
                "window_minutes": SECURITY_CONFIG["RATE_LIMIT_WINDOW_MINUTES"],
            },
            "limits": {
                "max_file_size_mb": SECURITY_CONFIG["MAX_FILE_SIZE_MB"],
                "max_email_size_mb": SECURITY_CONFIG["MAX_EMAIL_SIZE_MB"],
                "max_emails_per_cycle": SECURITY_CONFIG["MAX_EMAILS_PER_CYCLE"],
            }
        }

    def connect_imap(self):
        """Connect to IMAP server"""
        try:
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(self.email_address, self.email_password)
            self._log("✅ Connected to IMAP inbox")
            return mail
        except Exception as e:
            self._log(f"❌ IMAP connection failed: {e}")
            return None
    
    def connect_smtp(self):
        """Connect to SMTP server"""
        try:
            if self.smtp_port == 465:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.ehlo()
                server.starttls()
                server.ehlo()
            server.login(self.email_address, self.email_password)
            return server
        except Exception as e:
            self._log(f"❌ SMTP connection failed: {e}")
            return None
    
    def extract_attachments(self, email_message, sender_email: str = "unknown") -> List[Dict]:
        """
        Extract and VALIDATE resume attachments from email.
        Rejects files that are too large, wrong type, or have mismatched headers.
        """
        attachments = []
        max_attachments = SECURITY_CONFIG["MAX_ATTACHMENTS_PER_EMAIL"]

        for part in email_message.walk():
            if len(attachments) >= max_attachments:
                self._log(f"⚠️ Max attachments ({max_attachments}) reached — ignoring rest")
                break

            if part.get_content_maintype() == "multipart":
                continue
            if part.get("Content-Disposition") is None:
                continue

            filename = part.get_filename()
            if not filename:
                continue

            file_extension = filename.lower().split(".")[-1]
            file_content = part.get_payload(decode=True)

            if file_content is None:
                continue

            # Run validation
            is_valid, reason = self._validate_attachment(filename, file_content)
            if not is_valid:
                self._log(f"🚫 REJECTED attachment '{filename}' from {sender_email}: {reason}")
                self._rejected_count += 1
                continue

            attachments.append({
                "filename": filename,
                "content": file_content,
                "extension": file_extension
            })
            self._log(f"✅ Attachment accepted: {filename} ({len(file_content)/1024:.1f}KB)")

        return attachments
    
    def analyze_resume_file(self, attachment: Dict, job_role: str = "software_engineer") -> Optional[Dict]:
        """
        Analyze resume attachment
        
        Args:
            attachment: Dict with filename and content
            job_role: Target job role for analysis
            
        Returns:
            Analysis results or None
        """
        try:
            # Save attachment to temporary file
            with tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=f".{attachment['extension']}"
            ) as temp_file:
                temp_file.write(attachment['content'])
                temp_file_path = temp_file.name

            # Read bytes for debug (PDF only)
            if attachment['extension'] == 'pdf':
                try:
                    with open(temp_file_path, 'rb') as f:
                        pdf_bytes = f.read()
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
                    print("[EmailAgent PDF Extracted Text Preview]", text[:500])
                except Exception as e:
                    print(f"[EmailAgent PDF Extraction Error] {e}")

            # Analyze using your existing analyzer
            results = self.analyze_resume(temp_file_path, job_role)

            # Clean up temp file
            os.unlink(temp_file_path)

            return results

        except Exception as e:
            self._log(f"❌ Analysis error: {e}")
            return None
    
    def generate_response_email(
        self, 
        candidate_name: str,
        analysis_results: Dict,
        is_shortlisted: bool
    ) -> str:
        """
        Generate email response based on analysis
        
        Args:
            candidate_name: Name of candidate
            analysis_results: Resume analysis results
            is_shortlisted: Whether candidate passed ATS threshold
            
        Returns:
            HTML email content
        """
        overall_score = analysis_results.get('overall_score', 0)
        ats_score = analysis_results.get('scores', {}).get('ats_compatibility', 0)
        skills_match = analysis_results.get('scores', {}).get('skills_match', 0)
        
        if is_shortlisted:
            # Shortlisted email template
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #4F46E5; border-radius: 10px;">
                    <h2 style="color: #4F46E5; text-align: center;">🎉 Congratulations, {candidate_name}!</h2>
                    
                    <p>Dear {candidate_name},</p>
                    
                    <p>We are pleased to inform you that your resume has been <strong style="color: #10B981;">successfully shortlisted</strong> 
                    for further review!</p>
                    
                    <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #4F46E5; margin-top: 0;">📊 Your Resume Analysis Results:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                <strong>Overall Score:</strong> 
                                <span style="color: #10B981; font-size: 1.2em; font-weight: bold;">{overall_score}/100</span>
                            </li>
                            <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                <strong>ATS Compatibility:</strong> 
                                <span style="color: #10B981;">{ats_score}/100</span>
                            </li>
                            <li style="padding: 8px 0;">
                                <strong>Skills Match:</strong> 
                                <span style="color: #10B981;">{skills_match}/100</span>
                            </li>
                        </ul>
                    </div>
                    
                    <p><strong>What's Next?</strong></p>
                    <p>Our hiring team will review your application and contact you within 3-5 business days 
                    regarding the next steps in the interview process.</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br>
                    <strong>AI Resume Analyzer Team</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
                    <p style="font-size: 0.9em; color: #6B7280; text-align: center;">
                        This is an automated email. Please do not reply directly to this message.
                    </p>
                </div>
            </body>
            </html>
            """
        else:
            # Not shortlisted email template
            suggestions = analysis_results.get('suggestions', [])[:3]
            suggestions_html = ''.join([f'<li style="padding: 5px 0;">{s}</li>' for s in suggestions])
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #EF4444; border-radius: 10px;">
                    <h2 style="color: #EF4444; text-align: center;">Thank You for Your Application</h2>
                    
                    <p>Dear {candidate_name},</p>
                    
                    <p>Thank you for your interest in our position. After careful review of your resume, 
                    we regret to inform you that we will not be moving forward with your application at this time.</p>
                    
                    <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #EF4444; margin-top: 0;">📊 Your Resume Analysis Results:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 8px 0; border-bottom: 1px solid #FEE2E2;">
                                <strong>Overall Score:</strong> 
                                <span style="font-size: 1.2em; font-weight: bold;">{overall_score}/100</span>
                            </li>
                            <li style="padding: 8px 0; border-bottom: 1px solid #FEE2E2;">
                                <strong>ATS Compatibility:</strong> {ats_score}/100
                            </li>
                            <li style="padding: 8px 0;">
                                <strong>Skills Match:</strong> {skills_match}/100
                            </li>
                        </ul>
                    </div>
                    
                    <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #D97706; margin-top: 0;">💡 Suggestions to Improve Your Resume:</h3>
                        <ul style="color: #92400E;">
                            {suggestions_html}
                        </ul>
                    </div>
                    
                    <p>We encourage you to refine your resume based on the suggestions above and apply again in the future. 
                    We wish you the best in your job search.</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br>
                    <strong>AI Resume Analyzer Team</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
                    <p style="font-size: 0.9em; color: #6B7280; text-align: center;">
                        This is an automated email. Please do not reply directly to this message.
                    </p>
                </div>
            </body>
            </html>
            """
        
        return html_content
    
    def send_email_response(
        self, 
        recipient_email: str, 
        subject: str, 
        html_content: str
    ) -> bool:
        """
        Send email response to candidate
        
        Args:
            recipient_email: Candidate's email address
            subject: Email subject line
            html_content: HTML email body
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['From'] = self.email_address
            message['To'] = recipient_email
            message['Subject'] = subject
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            # Connect and send
            smtp_server = self.connect_smtp()
            if smtp_server:
                smtp_server.send_message(message)
                smtp_server.quit()
                self._log(f"📧 Response email sent to {recipient_email}")
                return True
            else:
                self._log(f"❌ Failed to send response email to {recipient_email}")
                return False
                
        except Exception as e:
            self._log(f"❌ Email send error: {e}")
            return False
    
    def _get_email_body(self, email_message) -> str:
        """Extract plain text body from an email message."""
        body = ""
        try:
            if email_message.is_multipart():
                for part in email_message.walk():
                    ct = part.get_content_type()
                    cd = str(part.get("Content-Disposition", ""))
                    if ct == "text/plain" and "attachment" not in cd:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode("utf-8", errors="ignore")
                            break
            else:
                payload = email_message.get_payload(decode=True)
                if payload:
                    body = payload.decode("utf-8", errors="ignore")
        except Exception:
            pass
        return body.strip()

    def _ensure_gmail_label(self, mail_conn, label_name: str) -> bool:
        """Create Gmail label if it doesn't already exist."""
        try:
            status, folders = mail_conn.list()
            if status == "OK":
                for f in folders:
                    decoded = f.decode("utf-8") if isinstance(f, bytes) else f
                    # IMAP folder lines look like: (\HasNoChildren) "/" "LabelName"
                    if f'"{label_name}"' in decoded or decoded.strip().endswith(label_name):
                        return True  # already exists
            # Create it
            status, _ = mail_conn.create(f'"{label_name}"')
            if status == "OK":
                self._log(f"🏷️  Created Gmail label: {label_name}")
                return True
            self._log(f"⚠️ Could not create Gmail label '{label_name}'")
            return False
        except Exception as e:
            self._log(f"⚠️ Label check/create failed: {e}")
            return False

    def _apply_gmail_label(self, mail_conn, imap_email_id, label_name: str):
        """
        Copy email to the label folder then delete from INBOX,
        effectively routing it to the correct Gmail label.
        """
        try:
            self._ensure_gmail_label(mail_conn, label_name)
            eid = imap_email_id if isinstance(imap_email_id, bytes) else imap_email_id.encode()
            status, _ = mail_conn.copy(eid, f'"{label_name}"')
            if status == "OK":
                mail_conn.store(eid, "+FLAGS", "\\Deleted")
                mail_conn.expunge()
                self._log(f"📂 Email routed to Gmail label: [{label_name}]")
            else:
                self._log(f"⚠️ IMAP copy to '{label_name}' failed (status={status})")
        except Exception as e:
            self._log(f"⚠️ Gmail label apply error: {e}")

    def _route_as_business_email(
        self,
        email_message,
        sender_email: str,
        sender_name: str,
        email_id: str,
        mail_conn=None,
    ):
        """
        Called when an email has no resume attachment.
        1. Classifies by business category using subject/body keywords
        2. Saves to categorized_mails (correct column names: from_email, from_name, …)
        3. Applies the matching Gmail label so it lands in the right folder
        """
        subject = email_message.get("Subject", "(No Subject)")
        body    = self._get_email_body(email_message)
        snippet = body[:400]

        # ── 1. Classify ───────────────────────────────────────────────────────
        try:
            try:
                from email_classifier.classifier import classify_email, get_category_config, log_classification
            except ImportError:
                from backend.email_classifier.classifier import classify_email, get_category_config, log_classification
            category = classify_email(subject, snippet)
            cfg      = get_category_config(category)
            log_classification(sender_email, subject, category)
        except ImportError:
            text = (subject + " " + snippet).lower()
            if any(k in text for k in ["invoice", "payment", "bill", "salary", "finance", "account", "tax"]):
                category, cfg = "Finance",      {"priority": "MEDIUM", "icon": "💰"}
            elif any(k in text for k in ["shipment", "delivery", "logistics", "order", "cargo", "freight"]):
                category, cfg = "Logistics",    {"priority": "MEDIUM", "icon": "🚚"}
            elif any(k in text for k in ["resume", "cv", "applying", "application", "job", "career"]):
                category, cfg = "Resume",       {"priority": "HIGH",   "icon": "📄"}
            else:
                category, cfg = "Uncategorized",{"priority": "LOW",    "icon": "📧"}

        icon     = cfg.get("icon", "📧")
        priority = cfg.get("priority", "LOW")
        label = cfg.get("label")
        if not label:
            label_map = {
                "Appointment": "HR_Appointments",
                "Resignation": "HR_Resignations",
                "Billing": "Finance_Billing",
                "BankStatement": "Finance_Statements",
                "Logistics": "Logistics",
                "Support": "Support",
                "Finance": "Finance_Billing",
                "Resume": "HR_Appointments",
                "Uncategorized": "Support",
            }
            label = label_map.get(category, "Support")
        self._log(f"{icon} [{category}] | From: {sender_email} | Subject: '{subject[:50]}'")

        # ── 2. Save to DB ─────────────────────────────────────────────────────
        try:
            try:
                from email_classifier.models import init_categorized_mail_table, save_categorized_mail
                from email_classifier.draft_generator import generate_draft
            except ImportError:
                from backend.email_classifier.models import init_categorized_mail_table, save_categorized_mail
                from backend.email_classifier.draft_generator import generate_draft
            init_categorized_mail_table()  # ensures table exists and schema is migrated
            save_categorized_mail(
                sender=sender_email,
                subject=subject,
                snippet=snippet,
                category=category,
                label=label,
                priority=priority,
                draft_body=generate_draft(category, sender_email, subject),
                auto_reply_sent=False,
            )
            self._log(f"💾 Saved to business mail DB — category: {category}")
        except Exception as e:
            self._log(f"⚠️ Could not save business email to DB: {e}")

        # ── 3. Apply Gmail label ───────────────────────────────────────────────
        if mail_conn is not None:
            self._apply_gmail_label(mail_conn, email_id, label)
        else:
            self._log(f"ℹ️  Gmail label '{label}' not applied — no IMAP connection available")

        # ── 4. Mark processed ─────────────────────────────────────────────────
        self.processed_emails.add(email_id)

    def process_email(self, email_message, email_id: str, raw_size: int = 0, mail_conn=None):
        """
        Process a single email with full DOS protection.
        Security order: duplicate → blocked → rate limit → size → attachment validation
        """
        try:
            # ── 1. Duplicate check ─────────────────────────────────────────────
            if email_id in self.processed_emails:
                return

            # ── 2. Extract sender info ─────────────────────────────────────────
            from_header = email.utils.parseaddr(email_message["From"])
            sender_name = from_header[0] or "Candidate"
            sender_email = from_header[1].lower().strip()

            self._log(f"📧 Email received from: {sender_name} <{sender_email}>")

            # ── 3. Blocked sender check ────────────────────────────────────────
            if self._is_blocked(sender_email):
                self._rejected_count += 1
                self.processed_emails.add(email_id)
                return

            # ── 4. Rate limit check ────────────────────────────────────────────
            if self._is_rate_limited(sender_email):
                self._rejected_count += 1
                self.processed_emails.add(email_id)
                return

            # ── 5. Email size check ────────────────────────────────────────────
            if raw_size > 0:
                max_bytes = SECURITY_CONFIG["MAX_EMAIL_SIZE_MB"] * 1024 * 1024
                if raw_size > max_bytes:
                    self._log(
                        f"🚫 EMAIL TOO LARGE from {sender_email}: "
                        f"{raw_size/(1024*1024):.1f}MB (max {SECURITY_CONFIG['MAX_EMAIL_SIZE_MB']}MB)"
                    )
                    self._rejected_count += 1
                    self.processed_emails.add(email_id)
                    return

            # ── 6. Record sender AFTER checks pass ────────────────────────────
            self._record_sender(sender_email)

            # ── 7. Extract & validate attachments ──────────────────────────────
            attachments = self.extract_attachments(email_message, sender_email)

            if not attachments:
                # No resume attachment — route as business/general email instead of skipping
                self._log(f"📭 No resume attachment from {sender_email} — routing as business email")
                self._route_as_business_email(email_message, sender_email, sender_name, email_id, mail_conn)
                return

            self._log(f"📎 {len(attachments)} valid attachment(s) from {sender_email}")

            # ── 8. Analyze ────────────────────────────────────────────────────
            resume_attachment = attachments[0]
            self._log(f"🔍 Analyzing: {resume_attachment['filename']} from {sender_email}")

            analysis_results = self.analyze_resume_file(resume_attachment)

            if analysis_results:
                ats_score = analysis_results.get("scores", {}).get("ats_compatibility", 0)
                overall_score = analysis_results.get("overall_score", 0)

                self._log(f"📊 Analysis complete — Overall: {overall_score}/100, ATS: {ats_score}/100")

                is_shortlisted = ats_score >= EMAIL_CONFIG["ATS_THRESHOLD"]

                if is_shortlisted:
                    self._log(f"✅ SHORTLISTED — {sender_email} (ATS: {ats_score} >= {EMAIL_CONFIG['ATS_THRESHOLD']})")
                    subject = "🎉 Your Resume Has Been Shortlisted!"
                else:
                    self._log(f"❌ REJECTED — {sender_email} (ATS: {ats_score} < {EMAIL_CONFIG['ATS_THRESHOLD']})")
                    subject = "Thank You for Your Application"

                html_content = self.generate_response_email(sender_name, analysis_results, is_shortlisted)
                self.send_email_response(sender_email, subject, html_content)
                self._processed_count += 1

            else:
                self._log(f"❌ Could not analyze resume from {sender_email}")

            # ── 9. Mark as done ────────────────────────────────────────────────
            self.processed_emails.add(email_id)

        except Exception as e:
            self._log(f"❌ Error processing email: {e}")
    
    def check_emails(self):
        """Check for new emails with resume attachments"""
        try:
            mail = self.connect_imap()
            if not mail:
                return
            
            # Select inbox
            mail.select('inbox')
            
            # Search for unread emails with attachments
            # You can modify this search criteria
            status, messages = mail.search(None, 'UNSEEN')
            
            if status != 'OK':
                self._log("❌ Could not search inbox")
                mail.logout()
                return
            
            email_ids = messages[0].split()
            
            if not email_ids:
                self._log("📭 No new emails in inbox")
                mail.logout()
                return
            
            self._log(f"📬 Found {len(email_ids)} new email(s) to process")
            
            max_per_cycle = SECURITY_CONFIG["MAX_EMAILS_PER_CYCLE"]
            if len(email_ids) > max_per_cycle:
                self._log(
                    f"⚠️ {len(email_ids)} emails in inbox — processing first {max_per_cycle} only (DOS protection)"
                )
                email_ids = email_ids[:max_per_cycle]

            for email_id in email_ids:
                # Fetch email
                status, msg_data = mail.fetch(email_id, "(RFC822)")

                if status != "OK":
                    continue

                raw_bytes = msg_data[0][1]
                raw_size = len(raw_bytes)

                # Parse email
                email_message = email.message_from_bytes(raw_bytes)

                # Process with security checks — pass mail conn for Gmail label routing
                self.process_email(email_message, email_id.decode(), raw_size, mail_conn=mail)

                # Small cooldown between emails to prevent CPU spike
                time.sleep(SECURITY_CONFIG["BATCH_COOLDOWN_SECONDS"])
            
            mail.logout()
            
        except Exception as e:
            self._log(f"❌ Email check error: {e}")
    
    def start_monitoring(self):
        """Start continuous email monitoring"""
        self._log("🤖 Email Agent started and monitoring inbox")
        print(f"📧 Monitoring: {self.email_address}")
        print(f"⏱️  Check Interval: {EMAIL_CONFIG['CHECK_INTERVAL']} seconds")
        print(f"🎯 ATS Threshold: {EMAIL_CONFIG['ATS_THRESHOLD']}")
        print("="*60)
        
        try:
            while True:
                self._log("🔍 Checking inbox...")
                self.check_emails()
                time.sleep(EMAIL_CONFIG['CHECK_INTERVAL'])
                
        except KeyboardInterrupt:
            print("\n\n🛑 Email Agent Stopped")
        except Exception as e:
            print(f"\n❌ Fatal Error: {e}")


# Example usage function
def create_email_agent(analyzer_function):
    """
    Create and start email agent
    
    Args:
        analyzer_function: Your resume analysis function
    """
    agent = EmailAgent(analyzer_function)
    return agent


if __name__ == "__main__":
    # This would be called from your main application
    print("""
    ⚠️  EMAIL AGENT CONFIGURATION REQUIRED
    
    Before running the email agent, you need to:
    
    1. Set up Gmail App Password:
       - Go to: https://myaccount.google.com/apppasswords
       - Create app password for 'Mail'
       - Copy the 16-character password
    
    2. Update EMAIL_CONFIG in this file:
       - EMAIL_ADDRESS: your-email@gmail.com
       - EMAIL_PASSWORD: your-app-password
    
    3. Run the agent from main.py
    
    For other email providers (Outlook, Yahoo):
    - Update IMAP_SERVER and SMTP_SERVER accordingly
    """)
