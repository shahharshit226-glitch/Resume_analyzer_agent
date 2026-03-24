# """
# categorized_mail_service.py
# Business-logic layer between the IMAP/email source and the DB.

# Call `process_non_resume_email(...)` whenever the existing EmailAgent
# encounters an email that is NOT a resume.  This keeps all new logic
# isolated from the original pipeline.
# """

# import logging
# from email_classifier.classifier import classify_email, is_resume_email
# from email_classifier.category_rules import CATEGORY_RULES
# from email_classifier.draft_generator import generate_draft
# from email_classifier.models import save_categorized_mail

# logger = logging.getLogger(__name__)


# def process_non_resume_email(
#     sender: str,
#     subject: str,
#     snippet: str = "",
#     received_at: str | None = None,
#     imap_conn=None,
#     uid: str | None = None,
# ) -> dict:
#     """
#     Full pipeline for a single non-resume email:

#     1. Classify by subject
#     2. Determine Gmail label
#     3. Apply label via IMAP (if connection provided)
#     4. Generate reply draft
#     5. Persist to DB

#     Parameters
#     ----------
#     sender      : str  — From: address
#     subject     : str  — email subject
#     snippet     : str  — first ~200 chars of the email body (plain text)
#     received_at : str  — ISO-format timestamp string or None
#     imap_conn   : imaplib.IMAP4_SSL | None — live connection for label ops
#     uid         : str | None — IMAP UID for label assignment

#     Returns
#     -------
#     dict with keys: category, label, priority, draft_body, mail_id
#     """

#     # 1. Classify
#     category = classify_email(subject)
#     logger.info(f"Classified '{subject}' → {category}")

#     # 2. Look up label & priority
#     rule = CATEGORY_RULES.get(category, {})
#     label = rule.get("label", "Support")
#     priority = rule.get("priority", "MEDIUM")

#     # 3. Apply Gmail label (best-effort; failures are non-fatal)
#     if imap_conn and uid:
#         try:
#             from email_classifier.label_manager import ensure_labels_exist, apply_label
#             ensure_labels_exist(imap_conn)
#             apply_label(imap_conn, uid, label)
#         except Exception as exc:
#             logger.warning(f"Label assignment skipped: {exc}")

#     # 4. Generate draft
#     draft_body = generate_draft(category, sender, subject)

#     # 5. Persist
#     mail_id = save_categorized_mail(
#         sender=sender,
#         subject=subject,
#         snippet=snippet[:300] if snippet else "",
#         category=category,
#         label=label,
#         priority=priority,
#         draft_body=draft_body,
#         received_at=received_at,
#     )

#     logger.info(f"Saved categorized mail id={mail_id} category={category}")

#     return {
#         "mail_id": mail_id,
#         "category": category,
#         "label": label,
#         "priority": priority,
#         "draft_body": draft_body,
#     }


# def should_skip_for_resume_pipeline(subject: str, has_attachment: bool) -> bool:
#     """
#     Convenience wrapper so the existing EmailAgent can call a single
#     function to decide routing.

#     Returns True if the email should be handled by the EXISTING resume
#     pipeline (and therefore BYPASSED by the new classifier).
#     """
#     return is_resume_email(subject, has_attachment)

"""
categorized_mail_service.py
Business-logic layer between the IMAP/email source and the DB.

Changes:
  - AUTO-REPLY is now sent immediately when any business email arrives
  - Draft is ALSO saved for future manual use
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from email_classifier.classifier import classify_email, is_resume_email
from email_classifier.category_rules import CATEGORY_RULES
from email_classifier.draft_generator import generate_draft
from email_classifier.models import save_categorized_mail, mark_auto_reply_sent

logger = logging.getLogger(__name__)

# ── Auto-reply message template ──────────────────────────────────────────────
# Short, friendly acknowledgement — sent immediately on receipt.
# The full professional draft (from draft_generator) is saved separately
# for manual follow-up.

AUTO_REPLY_SUBJECT = "We have received your email — {original_subject}"

AUTO_REPLY_BODY = """\
Dear {sender_name},

Thank you for reaching out to us.

We have received your email regarding "{original_subject}" and it has been \
taken into consideration. Our team is currently reviewing it and will get \
back to you with a complete response as soon as possible.

Please expect a reply within 1-2 business days.

If this is urgent, please do not hesitate to follow up.

Best regards,
AI AgenticHire Team
──────────────────────────────────────
This is an automated acknowledgement. A detailed reply will follow shortly.
"""


def _send_auto_reply(
    to_address: str,
    original_subject: str,
    smtp_user: str,
    smtp_pass: str,
    smtp_server: str = "smtp.gmail.com",
    smtp_port: int = 587,
) -> bool:
    """
    Send an instant acknowledgement auto-reply to the sender.
    Returns True on success, False on failure (non-fatal).
    """
    try:
        # Derive a polite name from the email address
        local_part = to_address.split("<")[-1].replace(">", "").strip()
        local_part = local_part.split("@")[0]
        sender_name = local_part.replace(".", " ").replace("_", " ").title()

        subject = AUTO_REPLY_SUBJECT.format(original_subject=original_subject[:60])
        body = AUTO_REPLY_BODY.format(
            sender_name=sender_name,
            original_subject=original_subject[:80],
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_user
        msg["To"]      = to_address

        # Plain text part
        msg.attach(MIMEText(body, "plain"))

        # HTML part — nicer looking in email clients
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px;">
          <div style="border-left: 4px solid #4F46E5; padding-left: 16px; margin-bottom: 20px;">
            <h2 style="color: #4F46E5; margin: 0;">✅ Email Received</h2>
            <p style="color: #6B7280; margin: 4px 0 0 0; font-size: 14px;">Automated Acknowledgement</p>
          </div>

          <p>Dear <strong>{sender_name}</strong>,</p>

          <p>Thank you for reaching out to us.</p>

          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;">
              📧 <strong>Your email regarding:</strong><br/>
              <span style="color: #4F46E5; font-weight: 600;">"{original_subject[:80]}"</span>
              <br/><br/>
              has been <strong>received and taken into consideration</strong>.
            </p>
          </div>

          <p>Our team is currently reviewing your message and will get back to you
          with a complete response <strong>within 1–2 business days</strong>.</p>

          <p>If this is urgent, please feel free to follow up.</p>

          <p style="margin-top: 30px;">
            Best regards,<br/>
            <strong>AI AgenticHire Team</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
            This is an automated acknowledgement. A detailed reply will follow shortly.
          </p>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to_address], msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to_address], msg.as_string())

        logger.info(f"✅ Auto-reply sent to {to_address}")
        return True

    except Exception as exc:
        logger.warning(f"⚠️ Auto-reply failed to {to_address}: {exc}")
        return False


def _get_smtp_credentials():
    """Load SMTP credentials from EMAIL_CONFIG (same as email_agent.py)."""
    try:
        from email_agent import EMAIL_CONFIG
        return (
            EMAIL_CONFIG.get("EMAIL_ADDRESS", ""),
            EMAIL_CONFIG.get("EMAIL_PASSWORD", ""),
            EMAIL_CONFIG.get("SMTP_SERVER", "smtp.gmail.com"),
            int(EMAIL_CONFIG.get("SMTP_PORT", 587)),
        )
    except Exception as exc:
        logger.warning(f"Could not load EMAIL_CONFIG: {exc}")
        return "", "", "smtp.gmail.com", 587


def process_non_resume_email(
    sender: str,
    subject: str,
    snippet: str = "",
    received_at=None,
    imap_conn=None,
    uid=None,
) -> dict:
    """
    Full pipeline for a single non-resume email:

    1. Classify by subject
    2. Determine Gmail label
    3. Apply label via IMAP (if connection provided)
    4. Send instant auto-reply acknowledgement  ← NEW
    5. Generate full professional draft (saved for manual follow-up)
    6. Persist everything to DB

    Parameters
    ----------
    sender      : str  — From: address (may include display name)
    subject     : str  — email subject
    snippet     : str  — first ~300 chars of the email body (plain text)
    received_at : str  — ISO-format timestamp string or None
    imap_conn   : imaplib.IMAP4_SSL | None — live connection for label ops
    uid         : str | None — IMAP UID for label assignment

    Returns
    -------
    dict with keys: category, label, priority, draft_body, mail_id,
                    auto_reply_sent
    """

    # 1. Classify
    category = classify_email(subject)
    logger.info(f"Classified '{subject}' → {category}")

    # 2. Look up label & priority
    rule    = CATEGORY_RULES.get(category, {})
    label    = rule.get("label", "Support")
    priority = rule.get("priority", "MEDIUM")

    # 3. Apply Gmail label (best-effort)
    if imap_conn and uid:
        try:
            from email_classifier.label_manager import ensure_labels_exist, apply_label
            ensure_labels_exist(imap_conn)
            apply_label(imap_conn, uid, label)
        except Exception as exc:
            logger.warning(f"Label assignment skipped: {exc}")

    # 4. Send instant auto-reply acknowledgement
    smtp_user, smtp_pass, smtp_server, smtp_port = _get_smtp_credentials()
    auto_replied = False
    if smtp_user and smtp_pass:
        # Extract clean email address from "Name <email>" format
        to_addr = sender
        if "<" in sender and ">" in sender:
            to_addr = sender.split("<")[1].replace(">", "").strip()

        auto_replied = _send_auto_reply(
            to_address=to_addr,
            original_subject=subject,
            smtp_user=smtp_user,
            smtp_pass=smtp_pass,
            smtp_server=smtp_server,
            smtp_port=smtp_port,
        )
    else:
        logger.warning("SMTP credentials not found — auto-reply skipped")

    # 5. Generate full professional draft (for manual follow-up)
    draft_body = generate_draft(category, sender, subject)

    # 6. Persist to DB
    mail_id = save_categorized_mail(
        sender=sender,
        subject=subject,
        snippet=snippet[:300] if snippet else "",
        category=category,
        label=label,
        priority=priority,
        draft_body=draft_body,
        received_at=received_at,
        auto_reply_sent=auto_replied,
    )

    if auto_replied:
        mark_auto_reply_sent(mail_id)

    logger.info(
        f"Saved mail id={mail_id} category={category} "
        f"auto_reply={'✅' if auto_replied else '❌'}"
    )

    return {
        "mail_id":        mail_id,
        "category":       category,
        "label":          label,
        "priority":       priority,
        "draft_body":     draft_body,
        "auto_reply_sent": auto_replied,
    }


def should_skip_for_resume_pipeline(subject: str, has_attachment: bool) -> bool:
    return is_resume_email(subject, has_attachment)