"""
categorized_mail_routes.py
New API endpoints for the Business Mail Center.

Mount this router in main_with_email_agent.py with:

    from routes.categorized_mail_routes import router as mail_router
    app.include_router(mail_router)

NO existing routes are touched.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import smtplib
from email.mime.text import MIMEText

from email_classifier.models import (
    init_categorized_mail_table,
    get_mails_by_category,
    get_all_mails,
    get_mail_by_id,
    mark_draft_sent,
)
from email_classifier.category_rules import (
    CATEGORY_RULES,
    CATEGORY_DISPLAY_NAMES,
    DASHBOARD_SECTIONS,
)

router = APIRouter(tags=["Business Mail Center"])


# ── Startup initialiser ──────────────────────────────────────────────────────

def init_mail_routes():
    """Call once on FastAPI startup to ensure the table exists."""
    init_categorized_mail_table()


# ── GET endpoints ────────────────────────────────────────────────────────────

@router.get("/categorized-mails/all")
def list_all_categorized_mails():
    """Return every categorized mail, newest first."""
    return JSONResponse(get_all_mails())


@router.get("/categorized-mails/categories")
def list_categories():
    """Return available category metadata for the frontend."""
    categories = []
    for key, display in CATEGORY_DISPLAY_NAMES.items():
        rule = CATEGORY_RULES.get(key, {})
        categories.append(
            {
                "key": key,
                "display": display,
                "label": rule.get("label", ""),
                "priority": rule.get("priority", ""),
            }
        )
    return JSONResponse(categories)


@router.get("/categorized-mails/dashboard-sections")
def dashboard_sections():
    """Return section → category mapping for the Business Mail Center UI."""
    result = {}
    for section, cats in DASHBOARD_SECTIONS.items():
        mails = []
        for cat in cats:
            mails.extend(get_mails_by_category(cat))
        # Sort by processed_at desc (string sort on 'YYYY-MM-DD HH:MM' works)
        mails.sort(key=lambda m: m.get("processed_at", ""), reverse=True)
        result[section] = {
            "categories": cats,
            "mails": mails,
            "total": len(mails),
        }
    return JSONResponse(result)


@router.get("/categorized-mails/{category}")
def list_mails_by_category(category: str):
    """
    Return mails for a specific category.
    Category must be one of: Appointment, Resignation, Billing,
    Logistics, BankStatement, Support, Uncategorized
    """
    valid = list(CATEGORY_RULES.keys()) + ["Uncategorized"]
    if category not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{category}'. Valid: {valid}",
        )
    return JSONResponse(get_mails_by_category(category))


# ── Draft / Send endpoint ────────────────────────────────────────────────────

@router.get("/draft/{mail_id}")
def get_draft(mail_id: int):
    """Return the auto-generated reply draft for a specific mail."""
    mail = get_mail_by_id(mail_id)
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")
    return JSONResponse(
        {
            "id": mail["id"],
            "to": mail["sender"],
            "subject": f"Re: {mail['subject']}",
            "body": mail["draft_body"],
            "status": mail["draft_status"],
        }
    )


@router.post("/draft/send/{mail_id}")
def send_draft(mail_id: int, smtp_user: str = "", smtp_pass: str = ""):
    """
    Optional: send the auto-generated draft via SMTP.

    If smtp_user / smtp_pass are not provided the endpoint reads from
    the existing EMAIL_CONFIG so no extra credentials are needed.

    The draft is NOT sent automatically — only when this endpoint is
    explicitly called (manual trigger from the dashboard).
    """
    mail = get_mail_by_id(mail_id)
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")

    if mail["draft_status"] == "sent":
        return JSONResponse({"status": "already_sent", "mail_id": mail_id})

    # Resolve credentials
    if not smtp_user or not smtp_pass:
        try:
            from email_agent import EMAIL_CONFIG
            smtp_user = EMAIL_CONFIG.get("EMAIL_ADDRESS", "")
            smtp_pass = EMAIL_CONFIG.get("EMAIL_PASSWORD", "")
        except Exception:
            raise HTTPException(
                status_code=500,
                detail="SMTP credentials not available. Pass smtp_user & smtp_pass.",
            )

    try:
        msg = MIMEText(mail["draft_body"], "plain")
        msg["Subject"] = f"Re: {mail['subject']}"
        msg["From"] = smtp_user
        msg["To"] = mail["sender"]

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [mail["sender"]], msg.as_string())

        mark_draft_sent(mail_id)
        return JSONResponse({"status": "sent", "mail_id": mail_id, "to": mail["sender"]})

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(exc)}")