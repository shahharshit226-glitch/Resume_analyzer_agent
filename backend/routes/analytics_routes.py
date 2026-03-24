"""
analytics_routes.py - Analytics data endpoints for charts and stat cards.
All queries read from the existing candidates.db SQLite database.
"""
import sqlite3, os
from datetime import datetime, timedelta
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router  = APIRouter(prefix="/analytics", tags=["Analytics"])
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


@router.get("/summary")
def summary():
    conn = _db()
    c    = conn.cursor()

    c.execute("SELECT COUNT(*) as n FROM candidates")
    total = c.fetchone()["n"]

    c.execute("SELECT status, COUNT(*) as n FROM candidates GROUP BY status")
    by_status = {r["status"]: r["n"] for r in c.fetchall()}

    c.execute("SELECT AVG(ats_score) as avg FROM candidates")
    avg_row  = c.fetchone()
    avg_score = round(avg_row["avg"] or 0, 1)

    conn.close()
    total_mails = auto_replied = 0
    try:
        mconn = _mail_db()
        mc = mconn.cursor()
        total_mails  = mc.execute("SELECT COUNT(*) as n FROM categorized_mails").fetchone()["n"]
        auto_replied = mc.execute("SELECT COUNT(*) as n FROM categorized_mails WHERE auto_reply_sent=1").fetchone()["n"]
        mconn.close()
    except Exception:
        pass
    return JSONResponse({
        "total_candidates":  total,
        "shortlisted":       by_status.get("Shortlisted", 0),
        "rejected":          by_status.get("Rejected", 0),
        "avg_ats_score":     avg_score,
        "total_mails":       total_mails,
        "mail_auto_replied": auto_replied,
    })


@router.get("/candidates-per-day")
def candidates_per_day():
    """Returns last 7 days, filling in zeros for missing days."""
    conn = _db()
    rows = conn.execute("""
        SELECT DATE(processed_at) as day,
               COUNT(*) as total,
               SUM(CASE WHEN status='Shortlisted' THEN 1 ELSE 0 END) as shortlisted,
               SUM(CASE WHEN status='Rejected'    THEN 1 ELSE 0 END) as rejected
        FROM candidates
        WHERE processed_at >= DATE('now', '-7 days')
        GROUP BY day
        ORDER BY day
    """).fetchall()
    conn.close()

    existing = {r["day"]: r for r in rows}
    today    = datetime.utcnow().date()
    result   = []
    for i in range(6, -1, -1):
        d   = str(today - timedelta(days=i))
        row = existing.get(d)
        result.append({
            "day":        d[-5:],   # MM-DD display
            "total":      row["total"]       if row else 0,
            "shortlisted": row["shortlisted"] if row else 0,
            "rejected":   row["rejected"]    if row else 0,
        })
    return JSONResponse(result)


@router.get("/score-distribution")
def score_distribution():
    """ATS score buckets for histogram."""
    conn = _db()
    rows = conn.execute("SELECT ats_score FROM candidates").fetchall()
    conn.close()

    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for r in rows:
        s = r["ats_score"] or 0
        if   s <= 20: buckets["0-20"]   += 1
        elif s <= 40: buckets["21-40"]  += 1
        elif s <= 60: buckets["41-60"]  += 1
        elif s <= 80: buckets["61-80"]  += 1
        else:         buckets["81-100"] += 1

    return JSONResponse([{"range": k, "count": v} for k, v in buckets.items()])


@router.get("/mail-categories")
def mail_categories():
    """Business mail counts by category for pie chart."""
    conn = _mail_db()
    try:
        rows = conn.execute("""
            SELECT category, COUNT(*) as count
            FROM categorized_mails
            GROUP BY category
            ORDER BY count DESC
        """).fetchall()
        result = [{"category": r["category"], "count": r["count"]} for r in rows]
    except Exception:
        result = []
    conn.close()
    return JSONResponse(result)


@router.get("/top-job-roles")
def top_job_roles():
    """Top 6 job roles by application count."""
    conn = _db()
    rows = conn.execute("""
        SELECT job_role,
               COUNT(*) as count,
               ROUND(AVG(ats_score), 1) as avg_score
        FROM candidates
        GROUP BY job_role
        ORDER BY count DESC
        LIMIT 6
    """).fetchall()
    conn.close()
    return JSONResponse([
        {"role": r["job_role"], "count": r["count"], "avg_score": r["avg_score"] or 0}
        for r in rows
    ])
