# DEVELOPMENT_RULES.md — AI AgenticHire v4.0
> Rules and conventions every developer (human or AI) must follow when working on this codebase.
> Violating these rules has historically caused bugs, CORS failures, import errors, and auth crashes.

---

## Rule 1: NEVER Use bcrypt in This Project

**Status:** Permanently banned  
**Reason:** Windows venv version conflicts between `passlib` and newer `bcrypt` packages cause 500 errors at runtime that look like CORS issues.

**What to use instead:**
```python
# ✅ CORRECT — already implemented in auth/auth.py
import hashlib, secrets

def _hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}{pw}".encode()).hexdigest()
    return f"{salt}:{h}"

def _verify_password(plain: str, stored: str) -> bool:
    salt, h = stored.split(":", 1)
    return hashlib.sha256(f"{salt}{plain}".encode()).hexdigest() == h
```

**Never do:**
```python
# ❌ BANNED
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], ...)
```

---

## Rule 2: NEVER Use Wildcard CORS With Credentials

**Status:** Permanent rule  
**Reason:** `allow_origins=["*"]` + `allow_credentials=True` is invalid per browser security spec. The browser silently drops the CORS headers causing a confusing error that looks like a server problem.

**Always use explicit origins:**
```python
# ✅ CORRECT
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
```

**Never do:**
```python
# ❌ CRASHES IN BROWSER
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, ...)
```

When adding production deployment: append the production domain to `allow_origins`. Do not remove the localhost entries.

---

## Rule 3: All New Backend Modules Must Use Fail-Safe Imports

**Status:** Mandatory architecture pattern  
**Reason:** The app must start and serve working features even when one module has an error or missing dependency.

**Pattern to follow (already in main_with_email_agent.py):**
```python
# ✅ CORRECT pattern for any new feature module
try:
    from routes.my_new_feature import router as my_router
    _HAS_MY_FEATURE = True
except ImportError as e:
    print(f"[WARN] My Feature: {e}")
    _HAS_MY_FEATURE = False

# Then register conditionally:
if _HAS_MY_FEATURE:
    app.include_router(my_router)
    print("My Feature routes registered")
```

**Never do:**
```python
# ❌ App crashes on startup if this import fails
from routes.my_new_feature import router as my_router
app.include_router(my_router)
```

---

## Rule 4: All Database Connections Must Use check_same_thread=False

**Status:** Required for SQLite + FastAPI  
**Reason:** FastAPI runs handlers in a thread pool. SQLite's default single-thread mode causes `ProgrammingError: SQLite objects created in a thread can only be used in that same thread.`

```python
# ✅ CORRECT
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.row_factory = sqlite3.Row  # Always add this for dict-style access

# ✅ CORRECT pattern: open and close per function call
def get_candidates():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT ...").fetchall()
    conn.close()
    return [dict(r) for r in rows]
```

---

## Rule 5: DB_PATH Must Be Resolved Relative to the File, Not CWD

**Status:** Required  
**Reason:** If you run uvicorn from a different directory, `os.getcwd()` changes but `__file__` is always the module's location.

```python
# ✅ CORRECT — works from any working directory
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "candidates.db")

# For files in subdirectories (auth/, routes/)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "candidates.db")

# ❌ WRONG — breaks when running uvicorn from different folders
DB_PATH = "candidates.db"
DB_PATH = os.path.join(os.getcwd(), "candidates.db")
```

---

## Rule 6: Never Add a Second on_event("startup") Handler

**Status:** Critical  
**Reason:** FastAPI allows only one startup event handler. Adding a second one silently overwrites the first, causing one DB to never initialise.

```python
# ✅ CORRECT — one single startup handler in main_with_email_agent.py
@app.on_event("startup")
async def on_startup():
    if _HAS_AUTH:
        init_users_table()
    if _HAS_MAIL:
        init_mail_routes()

# ❌ WRONG — never add this in candidates_db.py, auth_routes.py, or any module
@app.on_event("startup")  # This overwrites the one above
def init_something_else():
    ...
```

**If you add a new module that needs DB initialisation:** add its init call inside the existing `on_startup()` function in `main_with_email_agent.py`.

---

## Rule 7: Frontend Must Always Use Tailwind Core Classes Only

**Status:** Required  
**Reason:** No Tailwind compiler is available in the Vite dev setup — only the CDN stylesheet is loaded. This means JIT-compiled classes like `bg-[#1a1a2e]` or dynamically constructed classes (`bg-${color}-500`) will silently fail.

```jsx
// ✅ CORRECT — predefined Tailwind classes
<div className="bg-indigo-600 text-white rounded-2xl p-6">

// ❌ WRONG — arbitrary values, not in CDN stylesheet
<div className="bg-[#4F46E5] p-[24px]">

// ❌ WRONG — dynamic construction (class won't exist in CDN)
<div className={`bg-${color}-600`}>  // color="indigo" won't work

// ✅ CORRECT workaround for dynamic colours — use lookup object
const COLOURS = { indigo: "bg-indigo-600", purple: "bg-purple-600" }
<div className={COLOURS[color]}>
```

---

## Rule 8: No React Router — Use useRef + scrollIntoView for Navigation

**Status:** Architectural decision  
**Reason:** The app is a single-page scroll experience. React Router would add complexity without benefit.

```jsx
// ✅ CORRECT — existing navigation pattern
const analyzerRef = useRef(null);

const scrollToSection = (ref, section) => {
  ref.current?.scrollIntoView({ behavior: 'smooth' });
  setActiveSection(section);
};

<button onClick={() => scrollToSection(analyzerRef, 'analyzer')}>Go to Analyzer</button>

// ❌ WRONG — don't introduce React Router
import { useNavigate } from 'react-router-dom';
```

---

## Rule 9: Token Must Be Sent as Bearer Header, Not Query Parameter

**Status:** Security rule

```javascript
// ✅ CORRECT
const res = await fetch("http://localhost:8000/analytics/summary", {
  headers: { Authorization: `Bearer ${token}` }
});

// ❌ WRONG — token in URL is logged in server logs
const res = await fetch(`http://localhost:8000/endpoint?token=${token}`);
```

---

## Rule 10: Always Run check_backend.py Before Reporting Errors

**Status:** Workflow rule  
**Reason:** Many "errors" are actually import failures in optional modules. The health check script reveals exactly which module is broken and why.

```bash
cd backend
.venv\Scripts\activate
python check_backend.py
```

If any check shows ❌, fix that module before debugging other things.

---

## Rule 11: Always Activate the Correct Virtual Environment

**Status:** Critical operational rule  
**Reason:** This project has had multiple venvs created by mistake in wrong directories. Using the wrong venv causes package import failures, bcrypt crashes, and version conflicts.

**Correct venv:**
```
RESUMEANALYSER4.0/backend/.venv/
```

**How to verify you're in the right one:**
```bash
# Should show the backend .venv path
where python       # Windows
which python       # Mac/Linux

# Should show: fastapi, uvicorn, python-jose, pdfplumber
pip list | grep -E "fastapi|uvicorn|jose|pdfplumber"
```

**If you're in the wrong venv:**
```bash
deactivate
cd RESUMEANALYSER4.0/backend
.venv\Scripts\activate
```

---

## Rule 12: Never Commit .env to Git

**Status:** Security rule

Add to `.gitignore`:
```
backend/.env
*.db
__pycache__/
.venv/
node_modules/
```

---

## Rule 13: New Routes Go in Separate Files Under routes/

**Status:** Architecture convention  
**Reason:** Keeps `main_with_email_agent.py` clean. It should only orchestrate — not contain business logic.

```
✅ CORRECT structure:
backend/routes/my_feature_routes.py   ← new router lives here
backend/main_with_email_agent.py      ← just adds: from routes.my_feature_routes import router; app.include_router(router)

❌ WRONG — adding 50 lines of route logic directly to main_with_email_agent.py
```

---

## Rule 14: recharts Must Be Installed, Not Assumed

**Status:** Frontend dependency rule  
**Reason:** `recharts` is not in a standard React template and is not auto-installed by `npm install` unless it's in `package.json`.

```bash
# If AnalyticsDashboard.jsx shows import error:
cd frontend
npm install recharts
```

Verify it's in `frontend/package.json` under `dependencies`:
```json
"dependencies": {
  "recharts": "^2.x.x",
  ...
}
```

---

## Rule 15: Password Length Limitation Awareness

**Status:** Informational rule  
**Reason:** Our SHA256 implementation has no length limit (unlike bcrypt's 72-byte limit). However, for UX and security, enforce reasonable limits.

```python
# Recommended: validate in register endpoint
if len(user.password) < 6:
    raise HTTPException(400, "Password must be at least 6 characters")
if len(user.password) > 128:
    raise HTTPException(400, "Password too long")
```

---

## Code Style Conventions

### Python (Backend)
- Module docstring at top of every file explaining what it does
- One function per responsibility — no 100-line monster functions
- Print statements for startup/info: `print("✅ Auth routes registered")`
- Exception handling: always use specific `except Exception as e` + log `e`
- SQL: write queries inline as strings, not ORMs (project uses raw sqlite3)

### React/JSX (Frontend)
- Functional components only — no class components
- One component per file (except small sub-components like ScoreCard)
- Inline Tailwind classes — no separate CSS files
- `useEffect` cleanup: always `return () => clearInterval(id)` for pollers
- Error states: every `fetch()` call must have a try/catch

### Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Python files | snake_case | `analytics_routes.py` |
| Python functions | snake_case | `get_candidates()` |
| Python classes | PascalCase | `EmailAgent` |
| React components | PascalCase | `AnalyticsDashboard` |
| React files | PascalCase | `AnalyticsDashboard.jsx` |
| CSS classes | Tailwind utilities | `bg-indigo-600 rounded-xl` |
| DB columns | snake_case | `auto_reply_sent` |
| API endpoints | kebab-case | `/categorized-mails/dashboard-sections` |

---

## When Adding a New Feature — Checklist

```
Backend:
  □ Create new file in backend/routes/ or backend/services/
  □ Add fail-safe import to main_with_email_agent.py
  □ Add router with include_router() inside the _HAS_* check
  □ If needs DB: add init call to existing on_startup() — don't create new one
  □ Use DB_PATH relative to __file__ (not CWD)
  □ Add SQLite connection with check_same_thread=False
  □ Add endpoint to API_REFERENCE.md

Frontend:
  □ Create new .jsx file in frontend/src/
  □ Import in App.jsx
  □ Add useRef and section div to App.jsx layout
  □ Add nav link to NAV array in App.jsx
  □ Use only predefined Tailwind classes
  □ Fetch with Authorization: Bearer ${token} header
  □ Handle loading + error states

Testing:
  □ Run python check_backend.py — all checks must pass
  □ Open http://localhost:8000/docs — new endpoint must appear
  □ Test in browser with all 3 roles (admin, hr, finance)
  □ Check browser console for CORS or 401 errors
```