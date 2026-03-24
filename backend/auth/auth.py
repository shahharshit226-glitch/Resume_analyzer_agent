"""
auth.py - JWT authentication with role-based access control.
Uses SHA256 hashing instead of bcrypt to avoid version conflicts.
Roles: admin, hr, finance, user
"""

import os
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "agentic_hire_super_secret_2026_change_in_prod")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 8

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "candidates.db")


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"


def _hash_password(password: str) -> str:
    """SHA256 + salt — no bcrypt dependency."""
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"

def _verify_password(plain: str, stored: str) -> bool:
    """Verify against SHA256 hash or legacy bcrypt hash."""
    if ":" in stored and len(stored.split(":")[0]) == 32:
        salt, h = stored.split(":", 1)
        return hashlib.sha256(f"{salt}{plain}".encode()).hexdigest() == h
    # Legacy bcrypt fallback — try passlib if available
    try:
        from passlib.context import CryptContext
        ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return ctx.verify(plain, stored)
    except Exception:
        return False


def _get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_users_table():
    conn = _get_conn()
    cur  = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            name             TEXT    NOT NULL,
            email            TEXT    UNIQUE NOT NULL,
            hashed_password  TEXT    NOT NULL,
            role             TEXT    NOT NULL DEFAULT 'hr',
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cur.execute("SELECT COUNT(*) as cnt FROM users")
    if cur.fetchone()["cnt"] == 0:
        _seed_defaults(cur)
        conn.commit()
        print("✅ Default users seeded")
    else:
        # Re-hash existing users with new method if they have bcrypt hashes
        _rehash_users(conn)
    conn.close()


def _seed_defaults(cur):
    defaults = [
        ("Admin User",   "admin@agentic.com",   "admin123",   "admin"),
        ("HR Manager",   "hr@agentic.com",       "hr123",      "hr"),
        ("Finance Lead", "finance@agentic.com",  "finance123", "finance"),
    ]
    for name, email, pw, role in defaults:
        cur.execute(
            "INSERT INTO users (name, email, hashed_password, role) VALUES (?,?,?,?)",
            (name, email, _hash_password(pw), role)
        )


def _rehash_users(conn):
    """If existing users have bcrypt hashes, replace with SHA256 using known defaults."""
    known = {
        "admin@agentic.com":   "admin123",
        "hr@agentic.com":      "hr123",
        "finance@agentic.com": "finance123",
    }
    cur = conn.cursor()
    rows = cur.execute("SELECT id, email, hashed_password FROM users").fetchall()
    changed = False
    for row in rows:
        stored = row["hashed_password"]
        # Detect bcrypt hash (starts with $2b$ or $2a$)
        if stored.startswith("$2"):
            email = row["email"]
            pw = known.get(email)
            if pw:
                cur.execute(
                    "UPDATE users SET hashed_password=? WHERE id=?",
                    (_hash_password(pw), row["id"])
                )
                changed = True
                print(f"✅ Re-hashed password for {email}")
    if changed:
        conn.commit()


def get_user_by_email(email: str):
    conn = _get_conn()
    row  = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(name: str, email: str, password: str, role: str) -> bool:
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO users (name, email, hashed_password, role) VALUES (?,?,?,?)",
            (name, email, _hash_password(password), role)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def verify_password(plain: str, hashed: str) -> bool:
    return _verify_password(plain, hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)
    if not user:
        return None
    if not _verify_password(password, user["hashed_password"]):
        return None
    return user


async def get_current_user(token: str = Depends(oauth2_scheme)):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise exc
        return {"email": email, "role": payload.get("role", "hr"), "name": payload.get("name", "")}
    except JWTError:
        raise exc


def require_role(*roles):
    async def checker(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail=f"Access denied. Required: {list(roles)}")
        return user
    return checker


require_admin   = require_role("admin")
require_hr      = require_role("admin", "hr")
require_finance = require_role("admin", "finance")
require_any     = require_role("admin", "hr", "finance")
