# import sqlite3
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# import os
# from datetime import datetime

# DB_PATH = os.path.join(os.path.dirname(__file__), "candidates.db")

# def get_db():
#     conn = sqlite3.connect(DB_PATH, check_same_thread=False)
#     return conn

# def init_db():
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         """
#         CREATE TABLE IF NOT EXISTS candidates (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             email TEXT,
#             job_role TEXT,
#             ats_score INTEGER,
#             status TEXT,
#             processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         )
#         """
#     )
#     conn.commit()
#     conn.close()

# def save_candidate(email: str, job_role: str, score: int, threshold: int):
#     status = "Shortlisted" if score >= threshold else "Rejected"
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         "INSERT INTO candidates (email, job_role, ats_score, status) VALUES (?, ?, ?, ?)",
#         (email, job_role, score, status)
#     )
#     conn.commit()
#     conn.close()

# def get_candidates():
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         "SELECT email, job_role, ats_score, status, processed_at FROM candidates ORDER BY processed_at DESC"
#     )
#     rows = c.fetchall()
#     conn.close()
#     result = []
#     for row in rows:
#         result.append({
#             "email": row[0],
#             "job_role": row[1],
#             "score": row[2],
#             "status": row[3],
#             "date": datetime.strptime(row[4], "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d %H:%M") if row[4] else ""
#         })
#     return result

# # FastAPI extension for main_with_email_agent.py

# def register_candidate_routes(app: FastAPI):
#     @app.on_event("startup")
#     def _init():
#         init_db()

#     @app.get("/candidates")
#     def list_candidates():
#         return JSONResponse(get_candidates())


import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "candidates.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
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

# FastAPI extension for main_with_email_agent.py

def register_candidate_routes(app: FastAPI):
    @app.on_event("startup")
    def _init():
        init_db()

    @app.get("/candidates")
    def list_candidates():
        return JSONResponse(get_candidates())