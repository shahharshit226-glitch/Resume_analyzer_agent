"""
check_backend.py
Run this from your backend folder to verify everything works.

Usage:
    cd backend
    .venv\Scripts\activate
    python check_backend.py
"""

import sys, os, sqlite3, importlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

PASS = "✅"
FAIL = "❌"
WARN = "⚠️ "

results = []

def check(label, fn):
    try:
        msg = fn()
        results.append((PASS, label, msg or ""))
    except Exception as e:
        results.append((FAIL, label, str(e)))

# ── Python version ─────────────────────────────────────────────────────────────
check("Python version", lambda: sys.version.split()[0])

# ── Core packages ──────────────────────────────────────────────────────────────
def chk_pkg(name):
    def _():
        m = importlib.import_module(name)
        v = getattr(m, "__version__", "installed")
        return v
    return _

for pkg in ["fastapi", "uvicorn", "jose", "pydantic"]:
    check(f"Package: {pkg}", chk_pkg(pkg))

# passlib is optional now
try:
    import passlib
    results.append((PASS, "Package: passlib", getattr(passlib, "__version__", "installed")))
except Exception:
    results.append((WARN, "Package: passlib", "not installed (OK — using SHA256 auth)"))

# ── Auth module ────────────────────────────────────────────────────────────────
def chk_auth():
    from auth.auth import _hash_password, _verify_password, init_users_table
    h = _hash_password("test123")
    assert _verify_password("test123", h), "verify failed"
    assert not _verify_password("wrong", h), "verify should fail"
    return "hash + verify working"

check("Auth: password hashing", chk_auth)

def chk_auth_db():
    from auth.auth import init_users_table, get_user_by_email
    init_users_table()
    user = get_user_by_email("admin@agentic.com")
    assert user, "admin user not found"
    return f"admin user found, role={user['role']}"

check("Auth: DB + default users", chk_auth_db)

def chk_login():
    from auth.auth import authenticate_user
    user = authenticate_user("admin@agentic.com", "admin123")
    assert user, "admin login failed"
    user2 = authenticate_user("hr@agentic.com", "hr123")
    assert user2, "hr login failed"
    user3 = authenticate_user("finance@agentic.com", "finance123")
    assert user3, "finance login failed"
    return "admin + hr + finance login all work"

check("Auth: all 3 logins", chk_login)

def chk_jwt():
    from auth.auth import create_access_token, get_current_user
    token = create_access_token({"sub": "admin@agentic.com", "role": "admin", "name": "Admin"})
    assert token and len(token) > 20
    return "JWT token created"

check("Auth: JWT token creation", chk_jwt)

# ── DB checks ──────────────────────────────────────────────────────────────────
def chk_candidates_db():
    from candidates_db import register_candidate_routes
    return "candidates_db importable"

check("DB: candidates_db", chk_candidates_db)

def chk_db_tables():
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "candidates.db")
    conn = sqlite3.connect(DB_PATH)
    tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    conn.close()
    return f"tables: {', '.join(tables)}"

check("DB: SQLite tables", chk_db_tables)

# ── Route modules ──────────────────────────────────────────────────────────────
def chk_analytics():
    from routes.analytics_routes import router
    return f"{len(router.routes)} routes"

check("Routes: analytics", chk_analytics)

def chk_notifications():
    from routes.notifications_routes import router
    return f"{len(router.routes)} routes"

check("Routes: notifications", chk_notifications)

def chk_export():
    from routes.export_routes import router
    return f"{len(router.routes)} routes"

check("Routes: export", chk_export)

def chk_mail():
    from routes.categorized_mail_routes import router
    return f"{len(router.routes)} routes"

check("Routes: business mail", chk_mail)

# ── App load ───────────────────────────────────────────────────────────────────
def chk_app():
    from main_with_email_agent import app
    paths = [r.path for r in app.routes if hasattr(r, "path")]
    required = ["/auth/login", "/candidates", "/analytics/summary", "/notifications"]
    missing = [p for p in required if p not in paths]
    if missing:
        raise Exception(f"Missing routes: {missing}")
    return f"{len(paths)} total routes registered"

check("App: full app load + routes", chk_app)

# ── Print results ──────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  AI AgenticHire — Backend Health Check")
print("="*60)

failures = 0
for icon, label, msg in results:
    status_str = f"  {icon}  {label}"
    if msg:
        print(f"{status_str:<45} {msg}")
    else:
        print(status_str)
    if icon == FAIL:
        failures += 1

print("="*60)
if failures == 0:
    print("  🎉 ALL CHECKS PASSED — backend is ready!")
else:
    print(f"  ⚠️  {failures} check(s) failed — see above")
print("="*60 + "\n")