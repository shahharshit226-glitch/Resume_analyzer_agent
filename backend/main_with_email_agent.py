


# """
# AI Resume Analyzer with Email Agent
# Extends main.py with email monitoring capabilities
# Run with: uvicorn main_with_email_agent:app --reload
# """

# from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel
# from typing import Optional, Dict, Any
# import threading
# import io

# from email_agent import EmailAgent, EMAIL_CONFIG
# from candidates_db import register_candidate_routes

# # Import core analysis functions from main
# from app.main import (
#     analyze_resume_text,
#     JOB_ROLES,
#     extract_text_from_pdf,
#     extract_text_from_docx,
#     extract_text_from_txt,
#     extract_skills_from_job_description,
#     extract_keywords_from_job_description,
#     AnalysisResult
# )

# email_monitoring_active = False
# email_agent = None


# def resume_analyzer_for_email(file_bytes, job_role=None, job_description=None):
#     """Wrapper for email agent resume analysis — also saves result to DB"""
#     text = None
#     if isinstance(file_bytes, bytes):
#         if file_bytes[:4] == b'%PDF':
#             try:
#                 text = extract_text_from_pdf(file_bytes)
#             except Exception:
#                 pass
#         elif file_bytes[:2] == b'PK':
#             try:
#                 text = extract_text_from_docx(file_bytes)
#             except Exception:
#                 pass
#         else:
#             try:
#                 text = extract_text_from_txt(file_bytes)
#             except Exception:
#                 pass
#     elif isinstance(file_bytes, str):
#         # file_bytes is actually a file path
#         try:
#             with open(file_bytes, 'rb') as f:
#                 raw = f.read()
#             if raw[:4] == b'%PDF':
#                 text = extract_text_from_pdf(raw)
#             elif raw[:2] == b'PK':
#                 text = extract_text_from_docx(raw)
#             else:
#                 text = extract_text_from_txt(raw)
#         except Exception as e:
#             return {"error": f"Could not read file: {str(e)}"}

#     if not text or len(text.strip()) < 50:
#         return {"error": "Could not extract sufficient text from the resume."}

#     if job_description:
#         extracted_skills = extract_skills_from_job_description(job_description)
#         extracted_keywords = extract_keywords_from_job_description(job_description)
#         job_config = {
#             "name": "Custom Role",
#             "required_skills": extracted_skills if extracted_skills else ["communication", "teamwork", "problem solving"],
#             "keywords": extracted_keywords if extracted_keywords else ["developed", "managed"],
#             "experience_keywords": ["experience", "worked"]
#         }
#     else:
#         job_config = JOB_ROLES.get(job_role or "software_engineer")
#         if not job_config:
#             return {"error": "Invalid job role"}

#     results = analyze_resume_text(text, job_config)

#     # ✅ Save candidate result to database so dashboard updates
#     try:
#         from candidates_db import save_candidate
#         from app.main import extract_email as _extract_email
#         candidate_email = results.get("extracted_info", {}).get("email", "unknown@email.com")
#         if not candidate_email or candidate_email == "Not found":
#             candidate_email = "unknown@email.com"
#         save_candidate(
#             email=candidate_email,
#             job_role=job_config["name"],
#             score=results.get("overall_score", 0),
#             threshold=EMAIL_CONFIG["ATS_THRESHOLD"]
#         )
#         print(f"✅ Saved candidate {candidate_email} to database")
#     except Exception as e:
#         print(f"⚠️  Could not save candidate to DB: {e}")

#     return results


# # Create FastAPI app
# app = FastAPI(
#     title="AI Resume Analyzer with Email Agent",
#     description="Automated resume processing via email",
#     version="3.0.0"
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Register candidate dashboard routes (GET /candidates)
# register_candidate_routes(app)


# # ─── Email Agent Control ──────────────────────────────────────────────────────

# def start_email_monitoring():
#     global email_agent, email_monitoring_active
#     if email_monitoring_active:
#         print("⚠️  Email monitoring already active")
#         return
#     try:
#         email_agent = EmailAgent(resume_analyzer_for_email)
#         email_monitoring_active = True
#         email_agent.start_monitoring()
#     except Exception as e:
#         print(f"❌ Failed to start email monitoring: {e}")
#         email_monitoring_active = False


# # ─── Resume Analysis Endpoint ─────────────────────────────────────────────────

# @app.post("/analyze", response_model=AnalysisResult)
# async def analyze_resume(
#     file: UploadFile = File(...),
#     job_role: Optional[str] = Form(None),
#     job_description: Optional[str] = Form(None)
# ):
#     if not job_role and not job_description:
#         raise HTTPException(status_code=400, detail="Either 'job_role' or 'job_description' must be provided")

#     content = await file.read()
#     filename = file.filename.lower()

#     if filename.endswith('.pdf'):
#         text = extract_text_from_pdf(content)
#     elif filename.endswith('.docx'):
#         text = extract_text_from_docx(content)
#     elif filename.endswith('.txt'):
#         text = extract_text_from_txt(content)
#     else:
#         raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

#     if not text or len(text.strip()) < 50:
#         raise HTTPException(status_code=400, detail="Could not extract sufficient text from the resume.")

#     if job_description:
#         extracted_skills = extract_skills_from_job_description(job_description)
#         extracted_keywords = extract_keywords_from_job_description(job_description)
#         job_config = {
#             "name": "Custom Role",
#             "required_skills": extracted_skills if extracted_skills else ["communication", "teamwork", "problem solving"],
#             "keywords": extracted_keywords if extracted_keywords else ["developed", "managed"],
#             "experience_keywords": ["experience", "worked"]
#         }
#     else:
#         job_config = JOB_ROLES.get(job_role)
#         if not job_config:
#             raise HTTPException(status_code=400, detail="Invalid job role")

#     return analyze_resume_text(text, job_config)


# # ─── Root & Status Endpoints ──────────────────────────────────────────────────

# @app.get("/")
# async def root():
#     return {
#         "message": "AI Resume Analyzer API with Email Agent",
#         "version": "3.0.0",
#         "status": "active",
#         "email_agent": {
#             "enabled": email_monitoring_active,
#             "email": EMAIL_CONFIG["EMAIL_ADDRESS"] if EMAIL_CONFIG.get("EMAIL_ADDRESS") else "Not configured",
#             "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"]
#         }
#     }

# @app.get("/job-roles")
# async def get_job_roles():
#     return {
#         "job_roles": [
#             {"id": key, "name": value["name"], "skills_count": len(value["required_skills"])}
#             for key, value in JOB_ROLES.items()
#         ]
#     }

# @app.post("/start-email-agent")
# async def start_agent(background_tasks: BackgroundTasks):
#     global email_monitoring_active
#     if email_monitoring_active:
#         return {"status": "already_running", "message": "Email agent is already active"}
#     if not EMAIL_CONFIG.get("EMAIL_ADDRESS"):
#         return {"status": "error", "message": "Email not configured. Please update .env file"}
#     monitoring_thread = threading.Thread(target=start_email_monitoring, daemon=True)
#     monitoring_thread.start()
#     return {
#         "status": "started",
#         "message": "Email monitoring agent started successfully",
#         "config": {
#             "email": EMAIL_CONFIG["EMAIL_ADDRESS"],
#             "check_interval": EMAIL_CONFIG["CHECK_INTERVAL"],
#             "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"]
#         }
#     }

# @app.get("/email-agent-status")
# async def agent_status():
#     return {
#         "active": email_monitoring_active,
#         "processed_count": len(email_agent.processed_emails) if email_agent else 0,
#         "config": {
#             "email": EMAIL_CONFIG.get("EMAIL_ADDRESS") or "Not configured",
#             "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"],
#             "check_interval_seconds": EMAIL_CONFIG["CHECK_INTERVAL"]
#         }
#     }

# @app.get("/agent-log")
# async def get_agent_log():
#     """Return recent agent activity log"""
#     if email_agent and hasattr(email_agent, 'log'):
#         return email_agent.log[-20:]  # last 20 entries
#     return []

# @app.post("/update-ats-threshold/{threshold}")
# async def update_threshold(threshold: int):
#     if threshold < 0 or threshold > 100:
#         return {"error": "Threshold must be between 0 and 100"}
#     EMAIL_CONFIG["ATS_THRESHOLD"] = threshold
#     return {"status": "updated", "new_threshold": threshold, "message": f"ATS threshold updated to {threshold}"}


# if __name__ == "__main__":
#     import uvicorn
#     print("🚀 Starting AI Resume Analyzer with Email Agent...")
#     print(f"📧 Email: {EMAIL_CONFIG.get('EMAIL_ADDRESS', 'Not configured')}")
#     print(f"🎯 ATS Threshold: {EMAIL_CONFIG['ATS_THRESHOLD']}%")
#     print("🌐 Server: http://localhost:8000")
#     print("📚 API docs: http://localhost:8000/docs")
#     uvicorn.run(app, host="0.0.0.0", port=8000)



"""
AI Resume Analyzer with Email Agent
Extends main.py with email monitoring capabilities
Run with: uvicorn main_with_email_agent:app --reload
"""

from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import threading
import io

from email_agent import EmailAgent, EMAIL_CONFIG
from candidates_db import register_candidate_routes

# Import core analysis functions from main
from app.main import (
    analyze_resume_text,
    JOB_ROLES,
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    extract_skills_from_job_description,
    extract_keywords_from_job_description,
    AnalysisResult
)

email_monitoring_active = False
email_agent = None


def resume_analyzer_for_email(file_bytes, job_role=None, job_description=None):
    """Wrapper for email agent resume analysis — also saves result to DB"""
    text = None
    if isinstance(file_bytes, bytes):
        if file_bytes[:4] == b'%PDF':
            try:
                text = extract_text_from_pdf(file_bytes)
            except Exception:
                pass
        elif file_bytes[:2] == b'PK':
            try:
                text = extract_text_from_docx(file_bytes)
            except Exception:
                pass
        else:
            try:
                text = extract_text_from_txt(file_bytes)
            except Exception:
                pass
    elif isinstance(file_bytes, str):
        # file_bytes is actually a file path
        try:
            with open(file_bytes, 'rb') as f:
                raw = f.read()
            if raw[:4] == b'%PDF':
                text = extract_text_from_pdf(raw)
            elif raw[:2] == b'PK':
                text = extract_text_from_docx(raw)
            else:
                text = extract_text_from_txt(raw)
        except Exception as e:
            return {"error": f"Could not read file: {str(e)}"}

    if not text or len(text.strip()) < 50:
        return {"error": "Could not extract sufficient text from the resume."}

    if job_description:
        extracted_skills = extract_skills_from_job_description(job_description)
        extracted_keywords = extract_keywords_from_job_description(job_description)
        job_config = {
            "name": "Custom Role",
            "required_skills": extracted_skills if extracted_skills else ["communication", "teamwork", "problem solving"],
            "keywords": extracted_keywords if extracted_keywords else ["developed", "managed"],
            "experience_keywords": ["experience", "worked"]
        }
    else:
        job_config = JOB_ROLES.get(job_role or "software_engineer")
        if not job_config:
            return {"error": "Invalid job role"}

    results = analyze_resume_text(text, job_config)

    # ✅ Save candidate result to database so dashboard updates
    try:
        from candidates_db import save_candidate
        candidate_email = results.get("extracted_info", {}).get("email", "unknown@email.com")
        if not candidate_email or candidate_email == "Not found":
            candidate_email = "unknown@email.com"
        # Use ats_score (not overall_score) — shortlist decision is based on ATS score
        ats_score = results.get("scores", {}).get("ats_compatibility", 0)
        save_candidate(
            email=candidate_email,
            job_role=job_config["name"],
            score=ats_score,
            threshold=EMAIL_CONFIG["ATS_THRESHOLD"]
        )
        print(f"✅ Saved candidate {candidate_email} to database (ATS score: {ats_score})")
    except Exception as e:
        print(f"⚠️  Could not save candidate to DB: {e}")

    return results


# Create FastAPI app
app = FastAPI(
    title="AI Resume Analyzer with Email Agent",
    description="Automated resume processing via email",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register candidate dashboard routes (GET /candidates)
register_candidate_routes(app)


# ─── Email Agent Control ──────────────────────────────────────────────────────

def start_email_monitoring():
    global email_agent, email_monitoring_active
    if email_monitoring_active:
        print("⚠️  Email monitoring already active")
        return
    try:
        email_agent = EmailAgent(resume_analyzer_for_email)
        email_monitoring_active = True
        email_agent.start_monitoring()
    except Exception as e:
        print(f"❌ Failed to start email monitoring: {e}")
        email_monitoring_active = False


# ─── Resume Analysis Endpoint ─────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None)
):
    if not job_role and not job_description:
        raise HTTPException(status_code=400, detail="Either 'job_role' or 'job_description' must be provided")

    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith('.pdf'):
        text = extract_text_from_pdf(content)
    elif filename.endswith('.docx'):
        text = extract_text_from_docx(content)
    elif filename.endswith('.txt'):
        text = extract_text_from_txt(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from the resume.")

    if job_description:
        extracted_skills = extract_skills_from_job_description(job_description)
        extracted_keywords = extract_keywords_from_job_description(job_description)
        job_config = {
            "name": "Custom Role",
            "required_skills": extracted_skills if extracted_skills else ["communication", "teamwork", "problem solving"],
            "keywords": extracted_keywords if extracted_keywords else ["developed", "managed"],
            "experience_keywords": ["experience", "worked"]
        }
    else:
        job_config = JOB_ROLES.get(job_role)
        if not job_config:
            raise HTTPException(status_code=400, detail="Invalid job role")

    return analyze_resume_text(text, job_config)


# ─── Root & Status Endpoints ──────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "AI Resume Analyzer API with Email Agent",
        "version": "3.0.0",
        "status": "active",
        "email_agent": {
            "enabled": email_monitoring_active,
            "email": EMAIL_CONFIG["EMAIL_ADDRESS"] if EMAIL_CONFIG.get("EMAIL_ADDRESS") else "Not configured",
            "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"]
        }
    }

@app.get("/job-roles")
async def get_job_roles():
    return {
        "job_roles": [
            {"id": key, "name": value["name"], "skills_count": len(value["required_skills"])}
            for key, value in JOB_ROLES.items()
        ]
    }

@app.post("/start-email-agent")
async def start_agent(background_tasks: BackgroundTasks):
    global email_monitoring_active
    if email_monitoring_active:
        return {"status": "already_running", "message": "Email agent is already active"}
    if not EMAIL_CONFIG.get("EMAIL_ADDRESS"):
        return {"status": "error", "message": "Email not configured. Please update .env file"}
    monitoring_thread = threading.Thread(target=start_email_monitoring, daemon=True)
    monitoring_thread.start()
    return {
        "status": "started",
        "message": "Email monitoring agent started successfully",
        "config": {
            "email": EMAIL_CONFIG["EMAIL_ADDRESS"],
            "check_interval": EMAIL_CONFIG["CHECK_INTERVAL"],
            "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"]
        }
    }

@app.get("/email-agent-status")
async def agent_status():
    base = {
        "active": email_monitoring_active,
        "processed_count": len(email_agent.processed_emails) if email_agent else 0,
        "config": {
            "email": EMAIL_CONFIG.get("EMAIL_ADDRESS") or "Not configured",
            "ats_threshold": EMAIL_CONFIG["ATS_THRESHOLD"],
            "check_interval_seconds": EMAIL_CONFIG["CHECK_INTERVAL"]
        }
    }
    if email_agent:
        base["security"] = email_agent.get_security_stats()
    return base


@app.post("/block-sender/{email}")
async def block_sender(email: str):
    """Manually block a sender from being processed"""
    if not email_agent:
        return {"error": "Email agent not running"}
    email_agent.block_sender(email)
    return {"status": "blocked", "email": email}


@app.post("/unblock-sender/{email}")
async def unblock_sender(email: str):
    """Remove a sender from the blocklist"""
    if not email_agent:
        return {"error": "Email agent not running"}
    email_agent.unblock_sender(email)
    return {"status": "unblocked", "email": email}

@app.get("/agent-log")
async def get_agent_log():
    """Return recent agent activity log"""
    if email_agent and hasattr(email_agent, 'log'):
        return email_agent.log[-20:]  # last 20 entries
    return []

@app.post("/update-ats-threshold/{threshold}")
async def update_threshold(threshold: int):
    if threshold < 0 or threshold > 100:
        return {"error": "Threshold must be between 0 and 100"}
    EMAIL_CONFIG["ATS_THRESHOLD"] = threshold
    return {"status": "updated", "new_threshold": threshold, "message": f"ATS threshold updated to {threshold}"}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Resume Analyzer with Email Agent...")
    print(f"📧 Email: {EMAIL_CONFIG.get('EMAIL_ADDRESS', 'Not configured')}")
    print(f"🎯 ATS Threshold: {EMAIL_CONFIG['ATS_THRESHOLD']}%")
    print("🌐 Server: http://localhost:8000")
    print("📚 API docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)