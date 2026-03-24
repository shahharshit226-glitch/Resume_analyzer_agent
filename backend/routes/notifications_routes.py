"""
notifications_routes.py - Live notification feed from DB activity.
Polls candidates + categorized_mails tables for recent events.
"""
import sqlite3, os
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router  = APIRouter(prefix="/notifications", tags=["Notifications"])
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "candidates.db")
BUSINESS_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "business_mails.db")


def _db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _mail_db():
    conn = sqlite3.connect(BUSINESS_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("")
def get_notifications():
    """Return up to 20 notifications from the last 24 hours."""
    conn = _db()
    c    = conn.cursor()
    items = []

    # Recent candidates
    try:
        rows = c.execute("""
            SELECT email, job_role, ats_score, status, processed_at
            FROM candidates
            WHERE processed_at >= datetime('now', '-24 hours')
            ORDER BY processed_at DESC
            LIMIT 10
        """).fetchall()
        for r in rows:
            shortlisted = r["status"] == "Shortlisted"
            items.append({
                "id":       f"cand_{r['processed_at']}",
                "type":     "candidate",
                "icon":     "✅" if shortlisted else "❌",
                "title":    "Resume " + ("Shortlisted" if shortlisted else "Rejected"),
                "message":  f"{r['email']} — {r['job_role']} (ATS: {r['ats_score']}%)",
                "time":     r["processed_at"] or "",
                "priority": "high" if shortlisted else "normal",
                "read":     False,
            })
    except Exception:
        pass

    # Recent business mails
    MAIL_ICONS = {
        "Appointment": "📅", "Resignation": "🚪",
        "Billing": "💳",     "Logistics": "📦",
        "BankStatement": "🏦", "Support": "🛠️",
        "Uncategorized": "📬",
    }
    try:
        mconn = _mail_db()
        mc = mconn.cursor()
        rows = mc.execute("""
            SELECT sender, subject, category, priority, auto_reply_sent, processed_at
            FROM categorized_mails
            WHERE processed_at >= datetime('now', '-24 hours')
            ORDER BY processed_at DESC
            LIMIT 10
        """).fetchall()
        mconn.close()
        for r in rows:
            items.append({
                "id":       f"mail_{r['processed_at']}",
                "type":     "mail",
                "icon":     MAIL_ICONS.get(r["category"], "📧"),
                "title":    f"New {r['category']} Email",
                "message":  (r["subject"] or "")[:70],
                "time":     r["processed_at"] or "",
                "priority": "high" if r["priority"] == "HIGH" else "normal",
                "read":     False,
            })
    except Exception:
        pass

    conn.close()

    # Sort newest first
    items.sort(key=lambda x: x["time"], reverse=True)
    unread = len(items)
    return JSONResponse({"notifications": items[:20], "unread_count": unread})


@router.get("/count")
def unread_count():
    """Lightweight count-only endpoint for navbar polling."""
    conn = _db()
    c    = conn.cursor()
    count = 0
    try:
        cand = c.execute(
            "SELECT COUNT(*) as n FROM candidates WHERE processed_at >= datetime('now', '-1 hours')"
        ).fetchone()["n"]
        try:
            mconn = _mail_db()
            mc = mconn.cursor()
            mail = mc.execute(
                "SELECT COUNT(*) as n FROM categorized_mails WHERE processed_at >= datetime('now', '-1 hours')"
            ).fetchone()["n"]
            mconn.close()
        except Exception:
            mail = 0
        count = cand + mail
    except Exception:
        pass
    conn.close()
    return JSONResponse({"unread_count": count})
