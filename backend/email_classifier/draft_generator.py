"""
draft_generator.py — Template-based smart reply draft generator.

Drafts are generated synchronously (no AI calls) using simple
string templates keyed by category.  They are stored in the DB
with status='draft' and can be reviewed / sent manually via the
POST /draft/send/{id} endpoint.
"""

from datetime import datetime

# ── Templates ────────────────────────────────────────────────────────────────

_TEMPLATES: dict[str, str] = {
    "Appointment": (
        "Dear {sender_name},\n\n"
        "Thank you for reaching out regarding the {subject_ref}.\n\n"
        "We have received your request and our team will get back to you shortly "
        "to confirm the schedule. Please let us know your availability for the next "
        "few working days so we can arrange a mutually convenient time.\n\n"
        "Looking forward to connecting with you.\n\n"
        "Best regards,\n"
        "HR Team"
    ),
    "Resignation": (
        "Dear {sender_name},\n\n"
        "Thank you for informing us. We acknowledge receipt of your resignation "
        "and understand that your last working day will be as communicated.\n\n"
        "We appreciate your contributions and the time you have spent with us. "
        "Our HR team will be in touch shortly to guide you through the exit "
        "formalities, including the handover process and final settlement.\n\n"
        "We wish you all the best in your future endeavours.\n\n"
        "Warm regards,\n"
        "HR Department"
    ),
    "Billing": (
        "Dear {sender_name},\n\n"
        "Thank you for your email regarding {subject_ref}.\n\n"
        "We confirm that the invoice / billing communication has been received. "
        "Our finance team is currently reviewing the details and will process it "
        "according to our standard payment terms. Should there be any discrepancy "
        "or additional information required, we will contact you.\n\n"
        "Thank you for your patience.\n\n"
        "Regards,\n"
        "Finance Department"
    ),
    "Logistics": (
        "Dear {sender_name},\n\n"
        "Thank you for the update regarding {subject_ref}.\n\n"
        "We have noted the shipment / delivery details. Our operations team will "
        "coordinate accordingly and ensure that the necessary arrangements are in "
        "place for a smooth delivery. Please share the tracking number or any "
        "additional reference if applicable.\n\n"
        "Best regards,\n"
        "Operations Team"
    ),
    "BankStatement": (
        "Dear {sender_name},\n\n"
        "Thank you for sending the {subject_ref}.\n\n"
        "The document has been received and forwarded to our accounts team for "
        "reconciliation. We will reach out if any clarification is needed.\n\n"
        "Regards,\n"
        "Finance Department"
    ),
    "Support": (
        "Dear {sender_name},\n\n"
        "Thank you for contacting our support team regarding {subject_ref}.\n\n"
        "We have logged your request and assigned it to the relevant team. "
        "A support representative will respond within 1–2 business days with "
        "a resolution or further instructions.\n\n"
        "We apologise for any inconvenience caused and appreciate your patience.\n\n"
        "Kind regards,\n"
        "Support Team"
    ),
    "Uncategorized": (
        "Dear {sender_name},\n\n"
        "Thank you for your email regarding {subject_ref}.\n\n"
        "We have received your message and will review it. "
        "A member of our team will be in touch with you shortly.\n\n"
        "Best regards,\n"
        "Team"
    ),
}


def generate_draft(category: str, sender_email: str, subject: str) -> str:
    """
    Generate a reply draft string for a given category.

    Parameters
    ----------
    category    : str  — one of the CATEGORY_RULES keys or 'Uncategorized'
    sender_email: str  — used to derive a polite salutation
    subject     : str  — original email subject, used in the body

    Returns
    -------
    str  — ready-to-review draft text (NOT sent automatically)
    """
    template = _TEMPLATES.get(category, _TEMPLATES["Uncategorized"])

    # Derive a friendly name from the email address
    local_part = sender_email.split("@")[0] if "@" in sender_email else sender_email
    sender_name = local_part.replace(".", " ").replace("_", " ").title()

    # Shorten the subject for inline reference
    subject_ref = subject[:60].strip() if subject else "your recent email"

    draft = template.format(
        sender_name=sender_name,
        subject_ref=subject_ref,
    )
    return draft


def draft_metadata(category: str, sender_email: str, subject: str) -> dict:
    """
    Return a complete metadata dict ready for DB insertion / API response.
    """
    return {
        "category": category,
        "sender_email": sender_email,
        "subject": subject,
        "draft_body": generate_draft(category, sender_email, subject),
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "draft",   # 'draft' | 'sent'
    }