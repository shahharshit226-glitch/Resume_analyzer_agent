"""
auth_routes.py - Login, register, profile endpoints.
"""
import sqlite3, os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from .auth import (
    Token, UserCreate,
    authenticate_user, create_access_token,
    create_user, get_current_user, require_any,
    init_users_table,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "candidates.db")


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({
        "sub":  user["email"],
        "role": user["role"],
        "name": user["name"],
    })
    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         user["role"],
        "name":         user["name"],
    }


@router.post("/register")
def register(user: UserCreate):
    role = (user.role or "user").strip().lower()
    if role not in ("admin", "hr", "finance", "user"):
        raise HTTPException(status_code=400, detail="Role must be admin, hr, finance, or user")
    ok = create_user(user.name, user.email, user.password, role)
    if not ok:
        raise HTTPException(status_code=409, detail="Email already registered")
    return {"message": "User created successfully"}


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/users")
def list_users(current_user=Depends(require_any)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, name, email, role, created_at FROM users ORDER BY id"
    ).fetchall()
    conn.close()
    return JSONResponse([dict(r) for r in rows])
