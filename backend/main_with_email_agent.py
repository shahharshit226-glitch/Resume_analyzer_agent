"""
AI AgenticHire — Resume Analyzer v4.0
Extends main.py with email agent, auth, analytics, notifications, export.
Run with: uvicorn main_with_email_agent:app --reload --port 8000
"""

import sys
import os
import threading

# Ensure backend directory is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from email_agent import EmailAgent, EMAIL_CONFIG
from candidates_db import register_candidate_routes

from app.main import (
    analyze_resume_text,
    JOB_ROLES,
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    extract_skills_from_job_description,
    extract_keywords_from_job_description,
    AnalysisResult,
)

# ── Optional modules (all fail-safe) ──────────────────────────────────────────
try:
    from routes.categorized_mail_routes import router as mail_router, init_mail_routes
    _HAS_MAIL = True
except ImportError as _e:
    print(f"[WARN] Business Mail: {_e}"); _HAS_MAIL = False

try:
    from auth import auth_router, init_users_table
    _HAS_AUTH = True
except ImportError as _e:
    print(f"[WARN] Auth: {_e}"); _HAS_AUTH = False

try:
    from routes.analytics_routes import router as analytics_router
    _HAS_ANALYTICS = True
except ImportError as _e:
    print(f"[WARN] Analytics: {_e}"); _HAS_ANALYTICS = False

try:
    from routes.notifications_routes import router as notifications_router
    _HAS_NOTIFICATIONS = True
except ImportError as _e:
    print(f"[WARN] Notifications: {_e}"); _HAS_NOTIFICATIONS = False

try:
    from routes.export_routes import router as export_router
    _HAS_EXPORT = True
except ImportError as _e:
    print(f"[WARN] Export: {_e}"); _HAS_EXPORT = False

# ── Email agent state ──────────────────────────────────────────────────────────
email_monitoring_active = False
email_agent = None


def resume_analyzer_for_email(file_bytes, job_role=None, job_description=None):
    text = None
    if isinstance(file_bytes, bytes):
        if file_bytes[:4] == b'%PDF':
            try: text = extract_text_from_pdf(file_bytes)
            except Exception: pass
        elif file_bytes[:2] == b'PK':
            try: text = extract_text_from_docx(file_bytes)
            except Exception: pass
        else:
            try: text = extract_text_from_txt(file_bytes)
            except Exception: pass
    elif isinstance(file_bytes, str):
        try:
            with open(file_bytes, 'rb') as f: raw = f.read()
            if raw[:4] == b'%PDF': text = extract_text_from_pdf(raw)
            elif raw[:2] == b'PK': text = extract_text_from_docx(raw)
            else: text = extract_text_from_txt(raw)
        except Exception as e:
            return {"error": f"Could not read file: {e}"}

    if not text or len(text.strip()) < 50:
        return {"error": "Could not extract sufficient text from the resume."}

    if job_description:
        job_config = {
            "name": "Custom Role",
            "required_skills": extract_skills_from_job_description(job_description) or ["communication"],
            "keywords": extract_keywords_from_job_description(job_description) or ["developed"],
            "experience_keywords": ["experience", "worked"],
        }
    else:
        job_config = JOB_ROLES.get(job_role or "software_engineer")
        if not job_config:
            return {"error": "Invalid job role"}

    results = analyze_resume_text(text, job_config)

    try:
        from candidates_db import save_candidate
        email = results.get("extracted_info", {}).get("email", "unknown@email.com")
        if not email or email == "Not found":
            email = "unknown@email.com"
        ats = results.get("scores", {}).get("ats_compatibility", 0)
        save_candidate(email=email, job_role=job_config["name"],
                       score=ats, threshold=EMAIL_CONFIG["ATS_THRESHOLD"])
        print(f"Saved candidate {email} (ATS: {ats})")
    except Exception as e:
        print(f"[WARN] Could not save candidate: {e}")

    return results


# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI AgenticHire",
    description="Enterprise HR automation — v4.0",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routes
register_candidate_routes(app)
print("Candidate routes registered")

# Feature routes
if _HAS_AUTH:
    app.include_router(auth_router);          print("Auth routes registered")
if _HAS_MAIL:
    app.include_router(mail_router);          print("Business Mail routes registered")
if _HAS_ANALYTICS:
    app.include_router(analytics_router);     print("Analytics routes registered")
if _HAS_NOTIFICATIONS:
    app.include_router(notifications_router); print("Notifications routes registered")
if _HAS_EXPORT:
    app.include_router(export_router);        print("Export routes registered")


@app.on_event("startup")
async def on_startup():
    if _HAS_AUTH:
        try: init_users_table(); print("Auth DB ready")
        except Exception as e: print(f"[WARN] Auth DB: {e}")
    if _HAS_MAIL:
        try: init_mail_routes(); print("Business Mail DB ready")
        except Exception as e: print(f"[WARN] Mail DB: {e}")


# ── Email agent ────────────────────────────────────────────────────────────────
def start_email_monitoring():
    global email_agent, email_monitoring_active
    if email_monitoring_active:
        return
    try:
        email_agent = EmailAgent(resume_analyzer_for_email)
        email_monitoring_active = True
        email_agent.start_monitoring()
    except Exception as e:
        print(f"Failed to start email monitoring: {e}")
        email_monitoring_active = False


# ── API endpoints ──────────────────────────────────────────────────────────────
@app.post("/analyze", response_model=AnalysisResult)
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
):
    if not job_role and not job_description:
        raise HTTPException(400, "Either 'job_role' or 'job_description' must be provided")

    content = await file.read()
    fname   = file.filename.lower()

    if fname.endswith('.pdf'):       text = extract_text_from_pdf(content)
    elif fname.endswith('.docx'):    text = extract_text_from_docx(content)
    elif fname.endswith('.txt'):     text = extract_text_from_txt(content)
    else: raise HTTPException(400, "Unsupported format. Upload PDF, DOCX, or TXT.")

    if not text or len(text.strip()) < 50:
        raise HTTPException(400, "Could not extract sufficient text.")

    if job_description:
        job_config = {
            "name": "Custom Role",
            "required_skills": extract_skills_from_job_description(job_description) or ["communication"],
            "keywords": extract_keywords_from_job_description(job_description) or ["developed"],
            "experience_keywords": ["experience", "worked"],
        }
    else:
        job_config = JOB_ROLES.get(job_role)
        if not job_config:
            raise HTTPException(400, "Invalid job role")

    return analyze_resume_text(text, job_config)


@app.get("/")
async def root():
    return {
        "message": "AI AgenticHire API v4.0",
        "features": {
            "auth": _HAS_AUTH, "business_mail": _HAS_MAIL,
            "analytics": _HAS_ANALYTICS, "notifications": _HAS_NOTIFICATIONS,
            "export": _HAS_EXPORT,
        },
        "email_agent": {
            "enabled": email_monitoring_active,
            "email": EMAIL_CONFIG.get("EMAIL_ADDRESS") or "Not configured",
            "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"],
        },
    }


@app.get("/job-roles")
async def get_job_roles():
    return {"job_roles": [
        {"id": k, "name": v["name"], "skills_count": len(v["required_skills"])}
        for k, v in JOB_ROLES.items()
    ]}


@app.post("/start-email-agent")
async def start_agent(background_tasks: BackgroundTasks):
    global email_monitoring_active
    if email_monitoring_active:
        return {"status": "already_running"}
    if not EMAIL_CONFIG.get("EMAIL_ADDRESS"):
        return {"status": "error", "message": "Email not configured in .env"}
    threading.Thread(target=start_email_monitoring, daemon=True).start()
    return {"status": "started", "email": EMAIL_CONFIG["EMAIL_ADDRESS"]}


@app.get("/email-agent-status")
async def agent_status():
    base = {
        "active": email_monitoring_active,
        "processed_count": len(email_agent.processed_emails) if email_agent else 0,
        "config": {
            "email": EMAIL_CONFIG.get("EMAIL_ADDRESS") or "Not configured",
            "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"],
            "check_interval_seconds": EMAIL_CONFIG["CHECK_INTERVAL"],
        },
    }
    if email_agent:
        base["security"] = email_agent.get_security_stats()
    return base


@app.post("/block-sender/{email}")
async def block_sender(email: str):
    if not email_agent: return {"error": "Email agent not running"}
    email_agent.block_sender(email)
    return {"status": "blocked", "email": email}


@app.post("/unblock-sender/{email}")
async def unblock_sender(email: str):
    if not email_agent: return {"error": "Email agent not running"}
    email_agent.unblock_sender(email)
    return {"status": "unblocked", "email": email}


@app.get("/agent-log")
async def get_agent_log():
    if email_agent and hasattr(email_agent, 'log'):
        return email_agent.log[-20:]
    return []


@app.post("/update-ats-threshold/{threshold}")
async def update_threshold(threshold: int):
    if not 0 <= threshold <= 100:
        return {"error": "Threshold must be 0-100"}
    EMAIL_CONFIG["ATS_THRESHOLD"] = threshold
    return {"status": "updated", "new_threshold": threshold}


if __name__ == "__main__":
    import uvicorn
    print("Starting AI AgenticHire v4.0...")
    uvicorn.run(app, host="0.0.0.0", port=8000)