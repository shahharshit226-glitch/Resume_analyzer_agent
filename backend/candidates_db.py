


import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "candidates.db")
BUSINESS_DB_PATH = os.path.join(os.path.dirname(__file__), "business_mails.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    return conn

def get_business_db():
    conn = sqlite3.connect(BUSINESS_DB_PATH, check_same_thread=False)
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            job_role TEXT,
            ats_score INTEGER,
            status TEXT,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()

def save_candidate(email: str, job_role: str, score: int, threshold: int):
    status = "Shortlisted" if score >= threshold else "Rejected"
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO candidates (email, job_role, ats_score, status) VALUES (?, ?, ?, ?)",
        (email, job_role, score, status)
    )
    conn.commit()
    conn.close()

def get_candidates():
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "SELECT email, job_role, ats_score, status, processed_at FROM candidates ORDER BY processed_at DESC"
    )
    rows = c.fetchall()
    conn.close()
    result = []
    for row in rows:
        result.append({
            "email": row[0],
            "job_role": row[1],
            "score": row[2],
            "status": row[3],
            "date": datetime.strptime(row[4], "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d %H:%M") if row[4] else ""
        })
    return result

# ── Business / categorized mail table ────────────────────────────────────────

def init_categorized_mails_db():
    """Create the categorized_mails table if it doesn't exist."""
    conn = get_business_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS categorized_mails (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            from_email    TEXT NOT NULL,
            from_name     TEXT,
            subject       TEXT,
            body_snippet  TEXT,
            category      TEXT DEFAULT 'Uncategorized',
            priority      TEXT DEFAULT 'LOW',
            is_draft      INTEGER DEFAULT 0,
            draft_reply   TEXT,
            received_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Backward-compatible migration for old schema variants
    cols = {
        row[1]
        for row in conn.execute("PRAGMA table_info(categorized_mails)").fetchall()
    }
    if "from_email" not in cols:
        conn.execute("ALTER TABLE categorized_mails ADD COLUMN from_email TEXT")
    if "from_name" not in cols:
        conn.execute("ALTER TABLE categorized_mails ADD COLUMN from_name TEXT")
    if "body_snippet" not in cols:
        conn.execute("ALTER TABLE categorized_mails ADD COLUMN body_snippet TEXT")
    if "is_draft" not in cols:
        conn.execute("ALTER TABLE categorized_mails ADD COLUMN is_draft INTEGER DEFAULT 0")
    if "draft_reply" not in cols:
        conn.execute("ALTER TABLE categorized_mails ADD COLUMN draft_reply TEXT")
    if "received_at" not in cols:
        conn.execute("ALTER TABLE categorized_mails ADD COLUMN received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    # If table came from old model (sender/snippet), backfill new columns once
    if "sender" in cols:
        conn.execute("""
            UPDATE categorized_mails
            SET from_email = COALESCE(from_email, sender)
            WHERE from_email IS NULL OR from_email = ''
        """)
    if "snippet" in cols:
        conn.execute("""
            UPDATE categorized_mails
            SET body_snippet = COALESCE(body_snippet, snippet)
            WHERE body_snippet IS NULL OR body_snippet = ''
        """)

    conn.commit()
    conn.close()

def save_business_email(
    from_email: str,
    from_name: str,
    subject: str,
    body_snippet: str,
    category: str,
    priority: str = "LOW",
):
    """Insert one classified email into categorized_mails."""
    conn = get_business_db()
    conn.execute(
        """INSERT INTO categorized_mails
           (from_email, from_name, subject, body_snippet, category, priority)
           VALUES (?,?,?,?,?,?)""",
        (from_email, from_name or "", subject or "(No Subject)", body_snippet or "", category, priority),
    )
    conn.commit()
    conn.close()

def get_business_emails(category: str = None):
    """Return business emails, optionally filtered by category."""
    conn = get_business_db()
    conn.row_factory = sqlite3.Row
    if category:
        rows = conn.execute(
            "SELECT * FROM categorized_mails WHERE category=? ORDER BY received_at DESC",
            (category,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM categorized_mails ORDER BY received_at DESC"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── FastAPI extension for main_with_email_agent.py ────────────────────────────

def register_candidate_routes(app: FastAPI):
    @app.on_event("startup")
    def _init():
        init_db()
        init_categorized_mails_db()

    @app.get("/candidates")
    def list_candidates():
        return JSONResponse(get_candidates())

    @app.get("/business-emails")
    def list_business_emails(category: str = None):
        return JSONResponse(get_business_emails(category))

    @app.get("/business-emails/summary")
    def business_email_summary():
        conn = sqlite3.connect(BUSINESS_DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT category, COUNT(*) as count FROM categorized_mails GROUP BY category"
        ).fetchall()
        conn.close()
        return JSONResponse({r["category"]: r["count"] for r in rows})
    
    # Send this SubjectExpected LabelInterview Schedule for Next WeekHR_AppointmentsResignation Notice - Last Working DayHR_ResignationsInvoice #1042 Payment DueFinance_BillingShipment Tracking Update Order #5521LogisticsMonthly Bank Statement NovemberFinance_StatementsSupport Ticket: Login Error on PortalSupport
