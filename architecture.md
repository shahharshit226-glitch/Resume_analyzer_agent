# ARCHITECTURE.md — AI AgenticHire v4.0
> Technical system design reference. Read AI_CONTEXT.md first for project overview.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React + Vite)                         │
│                          localhost:5173                                 │
│                                                                         │
│  AuthProvider (JWT context) → AppContent                                │
│    ├── [not logged in]  → LoginPage                                     │
│    └── [logged in]      → ResumeAnalyzer (8-section single-page app)   │
│        ├── Navbar: Logo | 8 nav links | RoleBadge | NotificationBell   │
│        ├── Section: Hero                                                │
│        ├── Section: EmailAgentControl + CandidateDashboard (polls 10s) │
│        ├── Section: Features                                            │
│        ├── Section: Resume Analyzer (upload + results)                 │
│        ├── Section: BusinessMailCenter                                  │
│        ├── Section: AnalyticsDashboard (recharts)                      │
│        ├── Section: SearchFilter                                        │
│        └── Section: Guide + Footer                                      │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │ HTTP fetch / axios
                      │ CORS: explicit origins only
                      │ Auth: Authorization: Bearer <jwt>
┌─────────────────────▼───────────────────────────────────────────────────┐
│                     FastAPI App (Uvicorn)                               │
│                     localhost:8000                                      │
│                     main_with_email_agent.py                           │
│                                                                         │
│  Middleware: CORSMiddleware (explicit origins, allow_credentials=True)  │
│                                                                         │
│  Routers (all registered at startup with fail-safe imports):           │
│  ├── candidates_db      →  GET  /candidates                            │
│  ├── auth_router        →  POST /auth/login, /register  GET /me /users │
│  ├── mail_router        →  GET/POST /categorized-mails/* /draft/*      │
│  ├── analytics_router   →  GET  /analytics/*  (5 endpoints)           │
│  ├── notifications_router → GET /notifications  /notifications/count  │
│  └── export_router      →  GET  /export/*.csv                          │
│                                                                         │
│  Inline endpoints:                                                      │
│  POST /analyze  GET /  GET /job-roles                                   │
│  POST /start-email-agent  GET /email-agent-status  GET /agent-log      │
│  POST /block-sender/{e}   POST /unblock-sender/{e}                     │
│  POST /update-ats-threshold/{n}                                        │
│                                                                         │
│  Background Thread (daemon):                                            │
│  └── EmailAgent.start_monitoring() — polls Gmail IMAP every 60s       │
└──────┬──────────────────────────────┬──────────────────────────────────┘
       │ sqlite3                      │ imaplib / smtplib
       ▼                              ▼
┌──────────────┐             ┌─────────────────────────────┐
│  candidates  │             │  Gmail Account (external)   │
│     .db      │             │                             │
│              │             │  IMAP: imap.gmail.com:993   │
│  Tables:     │             │  SMTP: smtp.gmail.com:587   │
│  candidates  │             │  Auth: App Password         │
│  categorized │             └─────────────────────────────┘
│    _mails    │
│  users       │
└──────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Component Hierarchy
```
App.jsx
└── AuthProvider (AuthContext.jsx)
    └── AppContent
        ├── [loading=true]   ── Loading spinner
        ├── [!loggedIn]      ── LoginPage.jsx
        │     ├── Email + password form
        │     ├── Show/hide password toggle
        │     └── 3 quick-login demo buttons (Admin / HR / Finance)
        │
        └── [loggedIn]       ── ResumeAnalyzer (main component in App.jsx)
              │
              ├── <nav> ────────────────────────────────────────────────
              │   ├── Brand logo (Brain icon)
              │   ├── 8 nav link buttons (useRef scroll targets)
              │   ├── Role badge (coloured pill: ADMIN / HR / FINANCE)
              │   ├── User display name
              │   ├── NotificationBell.jsx
              │   │     ├── Bell + red badge (polls /notifications/count every 15s)
              │   │     └── Dropdown panel (fetches /notifications on open)
              │   └── Sign Out button → logout() → clear localStorage → LoginPage
              │
              ├── <section ref=homeRef>      Hero, stats, CTA buttons
              │
              ├── <div ref=agentRef>
              │   ├── EmailAgentControl      Start Agent / Check Status / Log display
              │   └── CandidateDashboard.jsx Table with 10s auto-refresh + manual refresh
              │
              ├── <section ref=featuresRef>  6 feature cards
              │
              ├── <section ref=analyzerRef>
              │   ├── File upload dropzone (PDF/DOCX/TXT)
              │   ├── Job role selector OR custom description textarea
              │   ├── Analyze button → POST /analyze
              │   └── Results (when available):
              │       ├── AI Summary card (purple gradient)
              │       ├── Overall Score card (grade A+/A/B/C/D)
              │       ├── Email report widget → POST /send-report
              │       ├── 5 ScoreCards (ATS/Skills/Experience/Formatting/Keywords)
              │       ├── Skills Analysis (found vs missing tags)
              │       ├── AI Suggestions list (numbered)
              │       └── Document Statistics (words, years exp, skills, sections)
              │
              ├── <div ref=businessRef>      BusinessMailCenter.jsx
              │   ├── 4 collapsible category sections
              │   ├── Each mail row: sender, subject, priority badge, auto-reply status
              │   └── Draft modal: view draft → click Send Draft → POST /draft/send/{id}
              │
              ├── <div ref=analyticsRef>     AnalyticsDashboard.jsx
              │   ├── 6 stat cards (recharts-free)
              │   ├── BarChart: candidates per day (last 7 days)
              │   ├── BarChart: ATS score distribution
              │   ├── PieChart: mail categories
              │   ├── Ranked list: top job roles
              │   └── Export download links (CSV)
              │
              ├── <div ref=searchRef>        SearchFilter.jsx
              │   ├── Search input (live filter)
              │   ├── Scope toggle: All / Candidates / Emails
              │   ├── Status filter (candidates) + Category filter (mails)
              │   ├── Candidates results table
              │   └── Business mails results table
              │
              ├── <section ref=guideRef>     3-step guide + pro tips
              │
              └── <footer>                   Links, contact, copyright
```

### 2.2 State Management Strategy
- **No Redux or Zustand** — deliberate simplicity
- `AuthContext` = single global state store for auth (user, token, login, logout, canAccess)
- All other state is local `useState` within each component
- Polling via `useEffect + setInterval` (cleaned up on unmount)
- Section navigation via `useRef` + `scrollIntoView` — no React Router, no URL changes

### 2.3 API Call Pattern
```javascript
// Services layer (api.js) — axios, used for email agent only
import { startEmailAgent, getEmailStatus, getAgentLog } from "./services/api";

// Direct fetch — used everywhere else
const res = await fetch("http://localhost:8000/analytics/summary", {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
```

### 2.4 Auth Flow in Frontend
```
Page load
  → AuthContext useEffect
  → token = localStorage.getItem("agh_token")
  → if token: GET /auth/me with Bearer token
    → success: setUser(data), setLoading(false)
    → fail:    clear localStorage, setToken(null), setLoading(false)
  → if no token: setLoading(false)

AppContent render logic:
  if loading → spinner
  if !user   → <LoginPage onLogin={() => setLoggedIn(true)} />
  else       → <ResumeAnalyzer />
```

---

## 3. Backend Architecture

### 3.1 Entry Point Design (main_with_email_agent.py)

The file uses a **fail-safe import pattern** so the app starts even if any module fails:

```python
try:
    from routes.analytics_routes import router as analytics_router
    _HAS_ANALYTICS = True
except ImportError as e:
    print(f"[WARN] Analytics: {e}")
    _HAS_ANALYTICS = False

# Registration only happens if import succeeded
if _HAS_ANALYTICS:
    app.include_router(analytics_router)
```

This means: if `categorized_mail_routes.py` has a missing dependency, the app still starts and serves auth, candidates, analytics, etc.

### 3.2 Module Responsibility Map

```
main_with_email_agent.py          ORCHESTRATOR
├── FastAPI app creation
├── CORS middleware config
├── All router registrations
├── on_event("startup") → init_users_table() + init_mail_routes()
├── resume_analyzer_for_email()   Bridge: EmailAgent → NLP → DB
├── start_email_monitoring()      Thread launcher
└── All inline HTTP endpoints

candidates_db.py                  CANDIDATES CRUD
├── DB_PATH resolution
├── init_db()                     Creates candidates table
├── save_candidate()              Insert + auto-status (Shortlisted/Rejected)
├── get_candidates()              SELECT all, newest first
└── register_candidate_routes()   Attaches startup + GET /candidates to app

auth/auth.py                      SECURITY CORE
├── _hash_password(pw)            → "salt:sha256hash"
├── _verify_password(plain, stored) → bool (handles SHA256 + legacy bcrypt)
├── _rehash_users()               Auto-migrate bcrypt → SHA256 on startup
├── init_users_table()            Create table + seed 3 defaults
├── authenticate_user()           DB lookup + verify
├── create_access_token()         JWT encode (8h expiry)
├── get_current_user()            FastAPI OAuth2 dependency
└── require_role(*roles)          Dependency factory for role enforcement

auth/auth_routes.py               AUTH ENDPOINTS
├── POST /auth/login              OAuth2PasswordRequestForm → Token
├── POST /auth/register           UserCreate model → insert user
├── GET  /auth/me                 Returns current user dict
└── GET  /auth/users              All users list (any role)

routes/analytics_routes.py        ANALYTICS QUERIES
├── GET /analytics/summary        6 aggregate stats (2 tables)
├── GET /analytics/candidates-per-day  Last 7 days with zero-fill
├── GET /analytics/score-distribution  5 ATS buckets
├── GET /analytics/mail-categories     Pie chart data
└── GET /analytics/top-job-roles       Top 6 roles

routes/notifications_routes.py    NOTIFICATION FEED
├── GET /notifications            Last 24h events, max 20, sorted desc
└── GET /notifications/count      Last 1h count only (fast poll)

routes/export_routes.py           CSV DOWNLOADS
├── GET /export/candidates.csv    StreamingResponse, all candidates
└── GET /export/business-mails.csv StreamingResponse, all mails

email_classifier/classifier.py    CLASSIFICATION ENGINE
├── classify_email(subject)       Regex word-boundary matching → category key
└── is_resume_email(subject, has_attachment) → bool heuristic

email_classifier/category_rules.py  CATEGORY DEFINITIONS
└── CATEGORIES dict: {
      "Appointment": {keywords:[...], label:"HR/Appointments", priority:"HIGH"},
      "Resignation":  ...,
      "Billing":      ...,
      "Logistics":    ...,
      "BankStatement": ...,
      "Support":      ...,
      "Uncategorized": ...
    }

email_classifier/draft_generator.py  REPLY TEMPLATES
└── generate_draft(category, sender, subject) → HTML string
    7 templates, one per category, personalized with sender/subject

email_classifier/label_manager.py   GMAIL LABELS
├── ensure_labels_exist(imap)    Create labels if missing (best-effort)
└── apply_label(imap, uid, label) Tag email in Gmail (best-effort)

email_classifier/models.py        MAIL TABLE CRUD
├── init_categorized_mail_table() Safe CREATE IF NOT EXISTS
├── save_categorized_mail(**kw)   INSERT + return id
├── get_all_mails()               All mails ordered by processed_at DESC
├── get_mails_by_category(cat)    Filter by category
├── mark_draft_sent(id)           UPDATE draft_status = 'sent'
└── mark_auto_reply_sent(id)      UPDATE auto_reply_sent = 1

services/categorized_mail_service.py  FULL PIPELINE
└── process_non_resume_email(sender, subject, snippet, received_at, imap_conn, uid)
    1. classify_email(subject) → category
    2. lookup label + priority from CATEGORIES
    3. apply_label(imap_conn, uid, label) [non-fatal]
    4. send SMTP auto-reply HTML
    5. generate_draft(category, sender, subject)
    6. save_categorized_mail() → DB
    Returns: saved mail dict

routes/categorized_mail_routes.py   MAIL ENDPOINTS
├── GET  /categorized-mails/all
├── GET  /categorized-mails/categories
├── GET  /categorized-mails/dashboard-sections  ← UI primary endpoint
├── GET  /categorized-mails/{category}
├── GET  /draft/{mail_id}
└── POST /draft/send/{mail_id}      Sends draft via SMTP, marks as sent

app/main.py                         NLP ANALYSIS CORE (unchanged)
├── JOB_ROLES dict                  6 roles: software_engineer, data_scientist,
│                                   product_manager, ui_ux_designer,
│                                   devops_engineer, full_stack_developer
├── analyze_resume_text(text, job_config) → AnalysisResult
│   Computes: ats_compatibility, skills_match, experience_strength,
│             formatting_quality, keyword_optimization, overall_score,
│             found_skills, missing_skills, suggestions, extracted_info
├── extract_text_from_pdf(bytes)    pdfplumber
├── extract_text_from_docx(bytes)   python-docx
├── extract_text_from_txt(bytes)    decode utf-8/latin-1
├── extract_skills_from_job_description(jd_text) → list[str]
└── extract_keywords_from_job_description(jd_text) → list[str]
```

---

## 4. Email Agent Architecture

### 4.1 Class Structure
```
EmailAgent
├── __init__(analyzer_function)
│   ├── email_address, email_password, imap_server, smtp_server, smtp_port
│   ├── analyze_resume = analyzer_function    (injected dependency)
│   ├── processed_emails: set()               (in-memory dedup across cycles)
│   ├── log: list[str]                        (last 50 timestamped entries)
│   ├── _rate_tracker: dict[email → list[datetime]]
│   ├── _blocked_senders: set()
│   ├── _rejected_count: int
│   └── _processed_count: int
│
├── Security Methods
│   ├── _is_blocked(sender)         Check blocklist
│   ├── _is_rate_limited(sender)    Sliding window: 3 per 60min per sender
│   ├── _validate_attachment(name, bytes)  Extension + size + magic bytes
│   ├── _check_email_size(bytes)    Total email ≤ 10MB
│   ├── block_sender(email)         Add to _blocked_senders
│   └── unblock_sender(email)       Remove from _blocked_senders
│
├── Connection Methods
│   ├── connect_imap()              IMAP4_SSL → login
│   └── connect_smtp()              SMTP or SMTP_SSL → login
│
├── Processing Methods
│   ├── extract_attachments(msg, sender)    Walk MIME parts, validate each
│   ├── analyze_resume_file(attachment)     Write temp file → call analyzer
│   ├── generate_response_email(name, results, shortlisted)  → HTML string
│   ├── send_email_response(to, subject, html)  → bool
│   └── process_email(msg, email_id, raw_size)  MAIN HANDLER (see below)
│
└── Monitoring Loop
    ├── check_emails()              IMAP search UNSEEN → process batch
    └── start_monitoring()          Infinite loop: check_emails + sleep(60)
```

### 4.2 process_email() Security Order
```
process_email(email_message, email_id, raw_size)
  Step 1: Duplicate check → email_id in processed_emails? → return
  Step 2: Parse From header → sender_name, sender_email
  Step 3: _is_blocked(sender_email)? → reject + mark done
  Step 4: _is_rate_limited(sender_email)? → reject + mark done
  Step 5: raw_size > 10MB? → reject + mark done
  Step 6: _record_sender(sender_email) ← only recorded AFTER all checks pass
  Step 7: extract_attachments() ← validates each attachment individually
  Step 8: No valid attachments?
    → process_non_resume_email() (business mail pipeline)
    → mark done
  Step 9: analyze_resume_file(attachments[0])
  Step 10: save_candidate() to DB
  Step 11: generate_response_email() + send_email_response() via SMTP
  Step 12: processed_emails.add(email_id)
```

### 4.3 DOS Protection Config
```python
SECURITY_CONFIG = {
    "RATE_LIMIT_MAX": 3,              # emails per sender
    "RATE_LIMIT_WINDOW_MINUTES": 60,  # per hour
    "MAX_FILE_SIZE_MB": 5,            # per attachment
    "MAX_ATTACHMENTS_PER_EMAIL": 2,   # max processed per email
    "MAX_EMAILS_PER_CYCLE": 20,       # max per IMAP check
    "MAX_EMAIL_SIZE_MB": 10,          # total email size
    "BATCH_COOLDOWN_SECONDS": 5,      # between emails in same cycle
    "BLOCKED_SENDERS": set(),         # persists during process lifetime
    "ALLOWED_EXTENSIONS": {"pdf", "docx", "txt"},
}
```

---

## 5. Database Design

### 5.1 All Tables in One File: `candidates.db`
```
candidates.db
│
├── candidates          ← Resume processing results
│   pk: id
│   email, job_role, ats_score, status, processed_at
│
├── categorized_mails   ← Business email processing results  
│   pk: id
│   sender, subject, snippet, category, label, priority
│   draft_body, draft_status, auto_reply_sent
│   received_at, processed_at
│
└── users               ← Authentication
    pk: id
    name, email (unique), hashed_password, role, created_at
```

### 5.2 No Foreign Keys
The tables are independent — no relational joins between them. Analytics queries use separate COUNT queries per table.

### 5.3 Connection Pattern
Every function that needs DB access creates its own connection:
```python
def _get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row   # enables dict-style access
    return conn
```
`check_same_thread=False` is required because FastAPI runs in a thread pool.

---

## 6. API Request/Response Flow

### 6.1 Authenticated Request Flow
```
React component
  → fetch(url, { headers: { Authorization: `Bearer ${token}` }})
  → FastAPI router handler
  → Depends(get_current_user) FastAPI dependency
    → OAuth2PasswordBearer extracts token from header
    → jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    → Returns {email, role, name} dict
  → Handler receives user dict, can check user["role"]
  → Execute DB query / business logic
  → Return JSONResponse
```

### 6.2 Resume Analysis Request Flow
```
POST /analyze (multipart/form-data)
  Body: file=<bytes>, job_role=<str> OR job_description=<str>

FastAPI handler:
  → await file.read() → content bytes
  → filename.endswith(".pdf") → extract_text_from_pdf(content)
  → len(text.strip()) < 50 → 400 error
  → job_description provided?
    YES → extract_skills + keywords → custom job_config
    NO  → JOB_ROLES[job_role] → predefined job_config
  → analyze_resume_text(text, job_config) → AnalysisResult
  → FastAPI serializes Pydantic model → JSON
```

### 6.3 CSV Export Flow
```
GET /export/candidates.csv
  → sqlite3 SELECT all candidates
  → io.StringIO buffer
  → csv.writer writes rows
  → buf.seek(0)
  → StreamingResponse(iter([buf.getvalue()]), media_type="text/csv")
  → Browser: Content-Disposition: attachment → download dialog
```

---

## 7. Security Architecture

### 7.1 Authentication Security
```
Password storage:
  salt = secrets.token_hex(16)          → 32 hex chars
  hash = sha256(f"{salt}{password}")    → 64 hex chars
  stored = f"{salt}:{hash}"            → 97 char string in DB

Verification:
  split stored on ":"
  recompute sha256(salt + plain_text)
  compare with stored hash

JWT:
  python-jose HS256
  payload: {sub, role, name, exp}
  exp: datetime.utcnow() + timedelta(hours=8)
```

### 7.2 Transport Security
- All communication over localhost in dev (HTTP)
- For production: add HTTPS via Render.com (free TLS) or Nginx reverse proxy
- CORS blocks cross-origin requests from non-listed domains

### 7.3 Input Validation
- FastAPI/Pydantic validates request bodies automatically
- File type: extension check + magic byte verification (not just extension)
- File size: checked at attachment level AND at total email level
- Text length: minimum 50 chars after extraction (rejects empty/corrupt files)

---

## 8. Deployment Architecture (Target)

```
Current (Local Dev):
  Browser → Vite:5173 → Uvicorn:8000 → SQLite file

Production (Planned):
  Browser
    ├── Vercel.com (React build, auto-deploy from GitHub main branch)
    │   └── VITE_API_URL env var → points to Render backend URL
    │
    └── Render.com (FastAPI, free tier, 512MB RAM)
        ├── DATABASE_URL env var → Supabase PostgreSQL
        ├── JWT_SECRET_KEY env var
        ├── EMAIL_ADDRESS / EMAIL_PASSWORD env vars
        └── Port: auto-assigned by Render

Migration checklist:
  □ Replace sqlite3 with psycopg2 / asyncpg
  □ Replace DB_PATH with DATABASE_URL
  □ Add production CORS origins
  □ Set JWT_SECRET_KEY (not default value)
  □ npm run build → dist/ → Vercel
  □ Update API base URL in frontend (env var)
```