"""
export_routes.py - CSV export for candidates and business mail reports.
"""
import csv, io, os, sqlite3
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router  = APIRouter(prefix="/export", tags=["Export"])
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


@router.get("/candidates.csv")
def export_candidates():
    """Download all candidates as CSV."""
    conn = _db()
    rows = conn.execute(
        "SELECT email, job_role, ats_score, status, processed_at FROM candidates ORDER BY processed_at DESC"
    ).fetchall()
    conn.close()

    buf = io.StringIO()
    w   = csv.writer(buf)
    w.writerow(["Email", "Job Role", "ATS Score", "Status", "Processed At"])
    for r in rows:
        w.writerow([r["email"], r["job_role"], r["ats_score"], r["status"], r["processed_at"]])

    buf.seek(0)
    filename = f"candidates_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/business-mails.csv")
def export_business_mails():
    """Download all categorised business mails as CSV."""
    conn = _mail_db()
    try:
        rows = conn.execute("""
            SELECT sender, subject, category, label, priority,
                   auto_reply_sent, draft_status, received_at, processed_at
            FROM categorized_mails
            ORDER BY processed_at DESC
        """).fetchall()
    except Exception:
        rows = []
    conn.close()

    buf = io.StringIO()
    w   = csv.writer(buf)
    w.writerow([
        "Sender", "Subject", "Category", "Label",
        "Priority", "Auto Reply Sent", "Draft Status",
        "Received At", "Processed At",
    ])
    for r in rows:
        w.writerow([
            r["sender"], r["subject"], r["category"], r["label"],
            r["priority"],
            "Yes" if r["auto_reply_sent"] else "No",
            r["draft_status"], r["received_at"], r["processed_at"],
        ])

    buf.seek(0)
    filename = f"business_mails_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
