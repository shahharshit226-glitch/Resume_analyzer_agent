# AI_CONTEXT.md — AI AgenticHire v4.0
> **READ THIS FIRST** in any new AI chat session to instantly restore full project context.
> Last updated: March 2026 | Owner: Harshit Shah, Bhubaneswar, Odisha, India

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | AI AgenticHire — Resume Analyzer |
| **Version** | 4.0.0 |
| **Owner** | Harshit Shah |
| **Contact** | harshitshahaaai906@gmail.com |
| **Location** | Bhubaneswar, Odisha, India |
| **Frontend URL** | http://localhost:5173 |
| **Backend URL** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Start Backend** | `python -m uvicorn main_with_email_agent:app --reload --port 8000` |
| **Start Frontend** | `cd frontend && npm run dev` |
| **Health Check** | `cd backend && python check_backend.py` |

---

## 2. Problem This App Solves

Small and medium companies manage hiring through a shared Gmail inbox and spreadsheets — no ATS, no automation, no analytics. Hiring managers manually read every resume, reply by hand, and track candidates in Google Sheets.

**AI AgenticHire solves this by:**
1. **Automating resume screening** — candidates email resumes to a monitored Gmail inbox; the AI agent scores them against ATS rules and replies with results automatically, within seconds
2. **Categorising all business emails** — invoices, resignations, logistics emails, bank statements are auto-classified, labelled in Gmail, acknowledged instantly, and stored with professional draft replies ready to send
3. **Providing enterprise HR intelligence** — analytics charts, role-based access control, live notification feed, and CSV export give HR teams full pipeline visibility without expensive tools like Workday, Greenhouse, or Lever

---

## 3. Key Features & Capabilities

### 3.1 Resume Analysis Pipeline
- Upload PDF / DOCX / TXT via web UI drag-and-drop
- Or simply **email** the resume to the monitored Gmail inbox — fully automated
- NLP-based ATS scoring across **5 dimensions**:
  - ATS Compatibility (keyword + formatting pass rate)
  - Skills Match (required vs found skills)
  - Experience Strength (years + impact keywords)
  - Formatting Quality (sections, structure)
  - Keyword Optimisation (JD keyword density)
- Supports **6 predefined job roles** + **custom job description** pasting
- All candidates automatically saved to SQLite and visible in Candidate Dashboard
- Score grade system: A+ (90+), A (80+), B (70+), C (60+), D (<60)

### 3.2 Email Agent (Agentic Automation)
- Monitors Gmail inbox via IMAP every 60 seconds (configurable via .env)
- **DOS Protection Layer** (enterprise-grade security):
  - Rate limiting: max 3 emails per sender per 60-minute sliding window
  - File size limits: 5MB per attachment, 10MB total email
  - Magic byte validation: PDF must start `%PDF`, DOCX must start `PK`
  - Extension whitelist: only `.pdf`, `.docx`, `.txt` accepted
  - Manual sender blocklist via `POST /block-sender/{email}`
  - Max 20 emails per monitoring cycle
  - 5-second cooldown between batch cycles
- Resume emails → full ATS analysis → HTML auto-reply (shortlisted or rejected template with scores + suggestions)
- Non-resume emails → Business Mail Classifier pipeline

### 3.3 Business Mail Center
- Classifies non-resume emails into 7 categories: `Appointment`, `Resignation`, `Billing`, `Logistics`, `BankStatement`, `Support`, `Uncategorized`
- Applies Gmail IMAP labels automatically (creates labels if missing)
- Sends instant HTML auto-reply acknowledgement via SMTP
- Generates professional draft follow-up reply (7 templates, one per category)
- Full dashboard with collapsible sections, draft preview, and "Send Draft" button
- Priority tiers: HIGH (Resignation, Appointment), MEDIUM (Billing, Support, Logistics), LOW (BankStatement, Uncategorized)

### 3.4 Authentication & Role-Based Access
- JWT login with 8-hour token expiry
- Password hashing: SHA256 + 32-char hex salt (no bcrypt — avoids Windows venv compatibility issues)
- 3 roles with different section visibility: Admin, HR, Finance
- 3 default accounts seeded automatically on first startup
- Token stored in `localStorage["agh_token"]`, validated on page load

### 3.5 Analytics Dashboard (recharts)
- 6 stat cards: Total Candidates, Shortlisted, Rejected, Avg ATS Score, Business Mails, Auto-Replied
- Bar chart: Candidates per day (last 7 days, shortlisted vs rejected stacked)
- Bar chart: ATS Score Distribution (5 buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
- Pie chart: Business Mail Categories breakdown
- Ranked list: Top 6 job roles by application count with avg scores

### 3.6 Search & Filter
- Unified search bar covering both candidates and business emails simultaneously
- Scope toggle: All / Candidates only / Emails only
- Status filter for candidates: All / Shortlisted / Rejected
- Category filter for mails: All / 7 categories
- Live result count display
- Separate results tables per data type

### 3.7 Notifications
- Bell icon in navbar with animated red badge
- Polls `GET /notifications/count` every 15 seconds (lightweight)
- Full feed loads on bell click: last 24 hours of candidates + business mails
- HIGH PRIORITY badge for shortlisted candidates and HIGH priority emails
- Colour-coded by type: indigo border = candidate, purple border = business mail

### 3.8 CSV Export
- `GET /export/candidates.csv` — all candidates with email, role, score, status, date
- `GET /export/business-mails.csv` — all mails with sender, subject, category, priority, auto-reply status
- Timestamped filenames: `candidates_YYYYMMDD_HHMM.csv`
- Direct download links in Analytics Dashboard

---

## 4. Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | latest | API framework |
| Uvicorn | latest | ASGI server |
| SQLite | stdlib | Database (single file) |
| python-jose | latest | JWT token creation/validation |
| python-dotenv | latest | .env config loading |
| pdfplumber | latest | PDF text extraction |
| python-docx | latest | DOCX text extraction |
| imaplib | stdlib | Gmail IMAP monitoring |
| smtplib | stdlib | Gmail SMTP sending |

> ⚠️ **No bcrypt** — deliberately replaced with `hashlib.sha256` + salt to avoid Windows venv version conflicts between `passlib` and newer `bcrypt` packages.

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | Component framework |
| Vite | latest | Dev server + bundler |
| Tailwind CSS | v3 (CDN) | All styling — no CSS files |
| recharts | latest | Bar, pie, line charts in AnalyticsDashboard |
| lucide-react | 0.383.0 | All icons throughout app |
| axios | latest | HTTP client (email agent endpoints only) |

---

## 5. Folder Structure

```
RESUMEANALYSER4.0/
│
├── backend/                              ← All Python / FastAPI code
│   ├── main_with_email_agent.py          ← APP ENTRY POINT — ALL routers registered here
│   ├── candidates_db.py                  ← candidates table CRUD + route registration
│   ├── email_agent.py                    ← EmailAgent class — IMAP + DOS + SMTP
│   ├── candidates.db                     ← SQLite database (auto-created on startup)
│   ├── check_backend.py                  ← Health check script — run to verify everything
│   ├── .env                              ← Email credentials (never commit to git)
│   │
│   ├── auth/                             ← JWT authentication module
│   │   ├── __init__.py                   ← Exports: auth_router, init_users_table, require_*
│   │   ├── auth.py                       ← SHA256 hashing, JWT, require_role() dependency
│   │   └── auth_routes.py                ← /auth/* endpoints
│   │
│   ├── routes/                           ← Feature-specific route modules
│   │   ├── analytics_routes.py           ← /analytics/* (5 endpoints)
│   │   ├── notifications_routes.py       ← /notifications + /notifications/count
│   │   ├── export_routes.py              ← /export/candidates.csv + /export/business-mails.csv
│   │   └── categorized_mail_routes.py    ← /categorized-mails/* + /draft/* endpoints
│   │
│   ├── email_classifier/                 ← Business email classification engine
│   │   ├── __init__.py
│   │   ├── category_rules.py             ← 7 category definitions with keywords, labels, priorities
│   │   ├── classifier.py                 ← classify_email() + is_resume_email() regex functions
│   │   ├── label_manager.py              ← IMAP label creation and application
│   │   ├── draft_generator.py            ← 7 professional HTML reply templates
│   │   └── models.py                     ← categorized_mails table CRUD functions
│   │
│   ├── services/
│   │   └── categorized_mail_service.py   ← Full pipeline: classify→label→reply→draft→save
│   │
│   └── app/
│       └── main.py                       ← CORE NLP ENGINE — analyze_resume_text(), JOB_ROLES
│
└── frontend/                             ← React application
    ├── package.json                      ← includes recharts dependency
    ├── vite.config.js
    └── src/
        ├── App.jsx                       ← Main shell: navbar, 8 section refs, auth gate
        ├── AuthContext.jsx               ← React Context: login/logout/token/canAccess()
        ├── LoginPage.jsx                 ← Login form + 3 quick-login demo tiles
        ├── NotificationBell.jsx          ← Bell icon, 15s polling, dropdown panel
        ├── CandidateDashboard.jsx        ← Candidate table, 10s auto-refresh, stats
        ├── BusinessMailCenter.jsx        ← Mail sections, draft modal, send button
        ├── AnalyticsDashboard.jsx        ← 4 recharts + 6 stat cards + export links
        ├── SearchFilter.jsx              ← Unified search with scope/status/category filters
        └── services/
            └── api.js                    ← Axios wrappers for email agent endpoints
```

---

## 6. Core Data Models

### `candidates` table
```sql
CREATE TABLE candidates (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT,                    -- candidate's email address
    job_role     TEXT,                    -- e.g. "Software Engineer"
    ats_score    INTEGER,                 -- 0-100, from ATS compatibility score
    status       TEXT,                    -- "Shortlisted" | "Rejected"
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```
**Shortlist rule:** `status = "Shortlisted"` if `ats_score >= EMAIL_CONFIG["ATS_THRESHOLD"]` (default: 70)

### `categorized_mails` table
```sql
CREATE TABLE categorized_mails (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    sender           TEXT,                -- sender email
    subject          TEXT,                -- original subject line
    snippet          TEXT,                -- first ~200 chars of body
    category         TEXT,                -- Appointment|Resignation|Billing|Logistics|BankStatement|Support|Uncategorized
    label            TEXT,                -- Gmail label string applied
    priority         TEXT,                -- HIGH | MEDIUM | LOW
    draft_body       TEXT,                -- full draft reply text
    draft_status     TEXT DEFAULT 'draft',-- "draft" | "sent"
    auto_reply_sent  INTEGER DEFAULT 0,   -- 0 = not sent, 1 = sent
    received_at      TEXT,                -- original email timestamp string
    processed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `users` table
```sql
CREATE TABLE users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    email            TEXT UNIQUE NOT NULL,
    hashed_password  TEXT NOT NULL,       -- format: "hex32salt:sha256hash"
    role             TEXT DEFAULT 'hr',   -- "admin" | "hr" | "finance"
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## 7. Key Workflows

### Workflow A — Resume via Web UI
```
User uploads file + selects job role in browser
  → POST /analyze (multipart/form-data)
  → FastAPI: detect format by file extension
  → Extract text: pdfplumber | python-docx | decode utf-8
  → Validate: text length ≥ 50 chars
  → Build job_config from job_role OR job_description
  → analyze_resume_text(text, job_config) → 5 scores + skills + suggestions
  → React renders: ScoreCards, AI Summary, Skills Analysis, Suggestions, Document Stats
  → User can email themselves the report via POST /send-report
```

### Workflow B — Resume via Email (Agentic)
```
Candidate sends email with resume attached to monitored Gmail
  → EmailAgent polls IMAP every 60 seconds
  → DOS checks in order: duplicate? blocked sender? rate limited? email too large?
  → extract_attachments() with: extension whitelist + size limit + magic byte check
  → Valid attachment found?
    YES → analyze_resume_file() → resume_analyzer_for_email()
          → save_candidate() to candidates.db
          → generate_response_email() (HTML shortlist or rejection template)
          → send_email_response() via SMTP
    NO  → process_non_resume_email() → Business Mail pipeline (see Workflow C)
```

### Workflow C — Business Mail Pipeline
```
Non-resume email arrives (or resume email with no valid attachment)
  → categorized_mail_service.process_non_resume_email(sender, subject, snippet, received_at, imap_conn, uid)
  → classify_email(subject) → category key (keyword regex matching)
  → Lookup: label string + priority from category_rules.CATEGORIES
  → apply_label(imap_conn, uid, label) [best-effort, non-fatal on failure]
  → Send SMTP auto-reply HTML acknowledgement
  → generate_draft(category, sender, subject) → professional follow-up template
  → save_categorized_mail() → stored in categorized_mails table
  → Appears in BusinessMailCenter dashboard under correct section
  → HR can click "Send Draft" → POST /draft/send/{mail_id} → sends via SMTP
```

### Workflow D — User Login
```
User enters email + password on LoginPage
  → POST /auth/login (application/x-www-form-urlencoded)
  → OAuth2PasswordRequestForm parses body
  → authenticate_user(email, password)
    → get_user_by_email() from users table
    → _verify_password(plain, stored): extract salt, sha256(salt+plain) == stored_hash?
  → create_access_token({sub, role, name, exp: +8h}) → JWT HS256
  → Response: {access_token, token_type, role, name}
  → Browser: localStorage.setItem("agh_token", token)
  → AuthContext: setUser({email, role, name})
  → AppContent: shows ResumeAnalyzer (main app shell)
  → All subsequent API calls: Authorization: Bearer <token>
```

---

## 8. Authentication & Security

### Password Storage
- Algorithm: `SHA256(salt + password)` where salt = `secrets.token_hex(16)` (32 hex chars)
- Stored format in DB: `"a3f2...32chars...:e8b1...64chars..."` (salt:hash)
- Auto-migration: on startup, detects legacy bcrypt hashes (`$2b$`) and re-hashes with SHA256 using known default passwords

### JWT Tokens
- Library: `python-jose`
- Algorithm: HS256
- Expiry: 8 hours
- Secret key: `JWT_SECRET_KEY` env var (default: `"agentic_hire_super_secret_2026_change_in_prod"`)
- Payload: `{sub: email, role: "admin|hr|finance", name: "Display Name", exp: timestamp}`

### Default Accounts (seeded automatically on first startup)
| Email | Password | Role |
|-------|----------|------|
| admin@agentic.com | admin123 | admin |
| hr@agentic.com | hr123 | hr |
| finance@agentic.com | finance123 | finance |

### Role Access Map
| Feature | admin | hr | finance |
|---------|-------|----|---------| 
| Candidates Dashboard | ✅ | ✅ | ❌ |
| Email Agent Control | ✅ | ✅ | ❌ |
| Business Mail Center | ✅ | ✅ | ✅ |
| Analytics Dashboard | ✅ | ✅ | ✅ |
| Search & Filter | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |

### CORS Configuration
```python
allow_origins = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",   # Alternative
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
allow_credentials = True
# NEVER use allow_origins=["*"] with allow_credentials=True — browsers block this
```

---

## 9. Environment Variables (.env in backend/)

```env
EMAIL_ADDRESS=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
IMAP_SERVER=imap.gmail.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
CHECK_INTERVAL=60
JWT_SECRET_KEY=change_this_before_deploying_to_production
```
> Gmail requires an **App Password** (not your main password): Google Account → Security → 2FA → App Passwords

---

## 10. Known Issues & Constraints

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| bcrypt / passlib incompatibility on Windows | Was Critical | ✅ Fixed | Replaced with SHA256+salt in auth.py |
| `allow_origins=["*"]` + `allow_credentials=True` | Was Critical | ✅ Fixed | Explicit origin list in CORS config |
| `on_event("startup")` deprecation warning | Low | Known | FastAPI wants `lifespan` handlers; works fine, shows warning only |
| SQLite not production-scale | Medium | By design | Fine for portfolio/demo; migrate to PostgreSQL for deployment |
| Email agent tied to one Gmail account | Medium | By design | Single-tenant; OAuth per-user needed for multi-tenant |
| No signup page in frontend | Low | Planned | `/auth/register` endpoint exists but no UI |
| Two venvs confusion | User issue | Documented | Always activate `backend/.venv`, not a parent-level venv |
| Notification count resets on page reload | Low | Known | Count is stateless (last 1 hour); no read/unread persistence |

---

## 11. Planned / Future Features

- [ ] **Signup page** — register new users via UI (backend endpoint exists: `POST /auth/register`)
- [ ] **Candidate detail page** — click any row → full analysis view with all 5 scores
- [ ] **Resume score history** — track score changes per candidate over multiple submissions
- [ ] **Job Role Management UI** — add/edit/delete roles without touching `app/main.py`
- [ ] **Dark mode toggle** — Tailwind dark: classes already partially supported
- [ ] **Admin user management panel** — create/edit/delete users from dashboard
- [ ] **Deployment** — Vercel (frontend) + Render.com (backend) + Supabase (PostgreSQL)
- [ ] **Multi-tenant** — each company connects their own Gmail account
- [ ] **B2C mode** — job seekers upload resume on a public page without login
- [ ] **Resume improvement chat** — after analysis, Claude API integration for specific resume advice
- [ ] **Bulk resume upload** — ZIP file support for batch processing

---

## 12. How to Run Locally

```bash
# 1. Backend
cd RESUMEANALYSER4.0/backend
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux
python -m uvicorn main_with_email_agent:app --reload --port 8000

# 2. Frontend (separate terminal)
cd RESUMEANALYSER4.0/frontend
npm install                     # first time only
npm run dev

# 3. Health check (optional but recommended)
cd RESUMEANALYSER4.0/backend
python check_backend.py
```

**Required packages:**
```bash
pip install fastapi uvicorn python-jose python-dotenv pdfplumber python-docx
# recharts in frontend:
npm install recharts
```