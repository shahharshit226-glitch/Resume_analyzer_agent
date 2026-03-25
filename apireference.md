# API_REFERENCE.md — AI AgenticHire v4.0
> Complete backend API documentation. Base URL: `http://localhost:8000`

---

## Authentication Note

Most endpoints are currently **open** (no server-side auth enforcement) — frontend enforces role visibility. The `get_current_user` dependency is available and used in auth endpoints. To enforce auth on any endpoint, add `user=Depends(get_current_user)` to the handler.

Endpoints marked 🔓 are public. Endpoints marked 🔐 require `Authorization: Bearer <token>` header.

---

## Category 1: Authentication APIs

### POST /auth/login
**Purpose:** Authenticate user and receive JWT token.

**Auth required:** 🔓 Public

**Request:** `application/x-www-form-urlencoded` (OAuth2 standard)
```
username=admin@agentic.com&password=admin123
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "admin",
  "name": "Admin User"
}
```

**Response 401:**
```json
{ "detail": "Incorrect email or password" }
```

**Example (curl):**
```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=admin@agentic.com&password=admin123"
```

**Frontend usage:**
```javascript
const body = new URLSearchParams({ username: email, password });
const res = await fetch("http://localhost:8000/auth/login", { method: "POST", body });
const { access_token, role, name } = await res.json();
localStorage.setItem("agh_token", access_token);
```

---

### POST /auth/register
**Purpose:** Create a new user account.

**Auth required:** 🔓 Public (consider restricting to admin in production)

**Request body:** `application/json`
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "securepass123",
  "role": "hr"
}
```
**role must be:** `"admin"` | `"hr"` | `"finance"`

**Response 200:**
```json
{ "message": "User created successfully" }
```

**Response 400:**
```json
{ "detail": "Role must be admin, hr, or finance" }
```

**Response 409:**
```json
{ "detail": "Email already registered" }
```

---

### GET /auth/me
**Purpose:** Validate token and return current user info.

**Auth required:** 🔐 Bearer token

**Response 200:**
```json
{
  "email": "admin@agentic.com",
  "role": "admin",
  "name": "Admin User"
}
```

**Response 401:**
```json
{ "detail": "Invalid or expired token" }
```

**Example (curl):**
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJhbGci..."
```

---

### GET /auth/users
**Purpose:** List all registered users.

**Auth required:** 🔐 Bearer token (any role)

**Response 200:**
```json
[
  { "id": 1, "name": "Admin User", "email": "admin@agentic.com", "role": "admin", "created_at": "2026-03-01 10:00:00" },
  { "id": 2, "name": "HR Manager", "email": "hr@agentic.com", "role": "hr", "created_at": "2026-03-01 10:00:00" },
  { "id": 3, "name": "Finance Lead", "email": "finance@agentic.com", "role": "finance", "created_at": "2026-03-01 10:00:00" }
]
```

---

## Category 2: Resume Analysis APIs

### POST /analyze
**Purpose:** Analyse an uploaded resume file against a job role or custom job description.

**Auth required:** 🔓 Public

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | Resume file (.pdf, .docx, or .txt) |
| `job_role` | string | One of these | Predefined role key |
| `job_description` | string | One of these | Custom JD text |

**Valid job_role values:**
`software_engineer` | `data_scientist` | `product_manager` | `ui_ux_designer` | `devops_engineer` | `full_stack_developer`

**Response 200 (AnalysisResult):**
```json
{
  "overall_score": 78,
  "scores": {
    "ats_compatibility": 82,
    "skills_match": 75,
    "experience_strength": 80,
    "formatting_quality": 70,
    "keyword_optimization": 83
  },
  "skills_analysis": {
    "found_skills": ["python", "react", "sql", "git"],
    "missing_skills": ["docker", "kubernetes", "aws"],
    "total_skills_found": 4
  },
  "suggestions": [
    "Add Docker and container orchestration experience",
    "Include quantifiable metrics in your experience bullets",
    "Add a dedicated Skills section at the top"
  ],
  "extracted_info": {
    "email": "candidate@gmail.com",
    "total_words": 450,
    "years_of_experience": 3,
    "sections_found": ["Experience", "Education", "Skills"]
  }
}
```

**Response 400:**
```json
{ "detail": "Unsupported file format. Upload PDF, DOCX, or TXT." }
{ "detail": "Could not extract sufficient text from the resume." }
{ "detail": "Either 'job_role' or 'job_description' must be provided" }
```

**Example (curl):**
```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@resume.pdf" \
  -F "job_role=software_engineer"
```

---

### GET /job-roles
**Purpose:** Get list of all available predefined job roles.

**Auth required:** 🔓 Public

**Response 200:**
```json
{
  "job_roles": [
    { "id": "software_engineer", "name": "Software Engineer", "skills_count": 10 },
    { "id": "data_scientist", "name": "Data Scientist", "skills_count": 7 },
    { "id": "product_manager", "name": "Product Manager", "skills_count": 5 },
    { "id": "ui_ux_designer", "name": "UI/UX Designer", "skills_count": 5 },
    { "id": "devops_engineer", "name": "DevOps Engineer", "skills_count": 6 },
    { "id": "full_stack_developer", "name": "Full Stack Developer", "skills_count": 6 }
  ]
}
```

---

## Category 3: Candidate APIs

### GET /candidates
**Purpose:** Get all processed candidates from the database, newest first.

**Auth required:** 🔓 Public (frontend restricts to HR/Admin)

**Response 200:**
```json
[
  {
    "email": "john.doe@gmail.com",
    "job_role": "Software Engineer",
    "score": 82,
    "status": "Shortlisted",
    "date": "2026-03-09 11:45"
  },
  {
    "email": "jane.smith@outlook.com",
    "job_role": "Data Scientist",
    "score": 58,
    "status": "Rejected",
    "date": "2026-03-09 10:30"
  }
]
```

> Note: field is `score` (not `ats_score`) — mapped in `get_candidates()` in candidates_db.py

---

## Category 4: Email Agent APIs

### POST /start-email-agent
**Purpose:** Start the background email monitoring agent in a daemon thread.

**Auth required:** 🔓 Public

**Response 200 (started):**
```json
{
  "status": "started",
  "email": "monitored@gmail.com"
}
```

**Response 200 (already running):**
```json
{ "status": "already_running" }
```

**Response 200 (not configured):**
```json
{ "status": "error", "message": "Email not configured in .env" }
```

---

### GET /email-agent-status
**Purpose:** Check if email agent is running and get security stats.

**Auth required:** 🔓 Public

**Response 200:**
```json
{
  "active": true,
  "processed_count": 12,
  "config": {
    "email": "monitored@gmail.com",
    "ats_threshold": 70,
    "check_interval_seconds": 60
  },
  "security": {
    "blocked_senders": [],
    "blocked_sender_count": 0,
    "rejected_by_security": 2,
    "successfully_processed": 10,
    "rate_limit_config": {
      "max_emails_per_sender": 3,
      "window_minutes": 60
    },
    "limits": {
      "max_file_size_mb": 5,
      "max_email_size_mb": 10,
      "max_emails_per_cycle": 20
    }
  }
}
```

---

### GET /agent-log
**Purpose:** Get recent email agent activity log (last 20 entries).

**Auth required:** 🔓 Public

**Response 200:**
```json
[
  "[11:45:23] 📬 Found 3 new email(s) to process",
  "[11:45:24] 📧 Email received from: John Doe <john@gmail.com>",
  "[11:45:25] ✅ Attachment accepted: resume.pdf (124.3KB)",
  "[11:45:27] 📊 Analysis complete — Overall: 78/100, ATS: 82/100",
  "[11:45:27] ✅ SHORTLISTED — john@gmail.com (ATS: 82 >= 70)",
  "[11:45:28] 📧 Response email sent to john@gmail.com"
]
```

---

### POST /block-sender/{email}
**Purpose:** Add a sender to the blocklist (persists while agent is running).

**Auth required:** 🔓 Public

**Path param:** `email` — sender's email address

**Response 200:**
```json
{ "status": "blocked", "email": "spammer@evil.com" }
```

---

### POST /unblock-sender/{email}
**Purpose:** Remove a sender from the blocklist.

**Auth required:** 🔓 Public

**Response 200:**
```json
{ "status": "unblocked", "email": "spammer@evil.com" }
```

---

### POST /update-ats-threshold/{threshold}
**Purpose:** Update the ATS score threshold for shortlisting decisions.

**Auth required:** 🔓 Public

**Path param:** `threshold` — integer 0-100

**Response 200:**
```json
{ "status": "updated", "new_threshold": 75 }
```

**Response 200 (error):**
```json
{ "error": "Threshold must be 0-100" }
```

---

## Category 5: Analytics APIs

### GET /analytics/summary
**Purpose:** Get aggregate statistics for stat cards in dashboard.

**Auth required:** 🔓 Public

**Response 200:**
```json
{
  "total_candidates": 47,
  "shortlisted": 18,
  "rejected": 29,
  "avg_ats_score": 64.3,
  "total_mails": 23,
  "mail_auto_replied": 21
}
```

---

### GET /analytics/candidates-per-day
**Purpose:** Get candidate counts for last 7 days (used in bar chart). Missing days return zero.

**Auth required:** 🔓 Public

**Response 200:**
```json
[
  { "day": "03-03", "total": 3, "shortlisted": 1, "rejected": 2 },
  { "day": "03-04", "total": 0, "shortlisted": 0, "rejected": 0 },
  { "day": "03-05", "total": 7, "shortlisted": 3, "rejected": 4 },
  { "day": "03-06", "total": 2, "shortlisted": 2, "rejected": 0 },
  { "day": "03-07", "total": 5, "shortlisted": 1, "rejected": 4 },
  { "day": "03-08", "total": 4, "shortlisted": 2, "rejected": 2 },
  { "day": "03-09", "total": 6, "shortlisted": 3, "rejected": 3 }
]
```

---

### GET /analytics/score-distribution
**Purpose:** Get ATS score histogram data (5 buckets).

**Auth required:** 🔓 Public

**Response 200:**
```json
[
  { "range": "0-20",   "count": 2  },
  { "range": "21-40",  "count": 5  },
  { "range": "41-60",  "count": 12 },
  { "range": "61-80",  "count": 20 },
  { "range": "81-100", "count": 8  }
]
```

---

### GET /analytics/mail-categories
**Purpose:** Get business mail counts per category for pie chart.

**Auth required:** 🔓 Public

**Response 200:**
```json
[
  { "category": "Billing",        "count": 8  },
  { "category": "Support",        "count": 6  },
  { "category": "Appointment",    "count": 4  },
  { "category": "Logistics",      "count": 3  },
  { "category": "Resignation",    "count": 1  },
  { "category": "Uncategorized",  "count": 1  }
]
```

---

### GET /analytics/top-job-roles
**Purpose:** Get top 6 job roles by application volume.

**Auth required:** 🔓 Public

**Response 200:**
```json
[
  { "role": "Software Engineer",   "count": 18, "avg_score": 71.2 },
  { "role": "Data Scientist",      "count": 12, "avg_score": 65.8 },
  { "role": "Full Stack Developer","count": 9,  "avg_score": 68.4 },
  { "role": "DevOps Engineer",     "count": 5,  "avg_score": 59.1 },
  { "role": "Product Manager",     "count": 2,  "avg_score": 72.0 },
  { "role": "UI/UX Designer",      "count": 1,  "avg_score": 81.0 }
]
```

---

## Category 6: Notification APIs

### GET /notifications
**Purpose:** Get full notification feed — last 24 hours of candidates and business mails, newest first.

**Auth required:** 🔓 Public

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "cand_2026-03-09 11:45:00",
      "type": "candidate",
      "icon": "✅",
      "title": "Resume Shortlisted",
      "message": "john.doe@gmail.com — Software Engineer (ATS: 82%)",
      "time": "2026-03-09 11:45:00",
      "priority": "high",
      "read": false
    },
    {
      "id": "mail_2026-03-09 10:30:00",
      "type": "mail",
      "icon": "🚪",
      "title": "New Resignation Email",
      "message": "Subject: Notice of Resignation - Effective April 1st",
      "time": "2026-03-09 10:30:00",
      "priority": "high",
      "read": false
    }
  ],
  "unread_count": 2
}
```

---

### GET /notifications/count
**Purpose:** Lightweight count of events in the last 1 hour. Used for navbar badge polling.

**Auth required:** 🔓 Public

**Response 200:**
```json
{ "unread_count": 3 }
```

> Called every 15 seconds by `NotificationBell.jsx`. Intentionally fast — single COUNT query.

---

## Category 7: Export APIs

### GET /export/candidates.csv
**Purpose:** Download all candidates as a CSV file.

**Auth required:** 🔓 Public

**Response:** `text/csv` with `Content-Disposition: attachment; filename=candidates_20260309_1145.csv`

**CSV columns:** `Email, Job Role, ATS Score, Status, Processed At`

**Example rows:**
```csv
Email,Job Role,ATS Score,Status,Processed At
john.doe@gmail.com,Software Engineer,82,Shortlisted,2026-03-09 11:45:00
jane.smith@outlook.com,Data Scientist,58,Rejected,2026-03-09 10:30:00
```

**Frontend usage:**
```html
<a href="http://localhost:8000/export/candidates.csv">⬇️ Export Candidates CSV</a>
```

---

### GET /export/business-mails.csv
**Purpose:** Download all business mails as a CSV file.

**Auth required:** 🔓 Public

**Response:** `text/csv` with `Content-Disposition: attachment; filename=business_mails_20260309_1145.csv`

**CSV columns:** `Sender, Subject, Category, Label, Priority, Auto Reply Sent, Draft Status, Received At, Processed At`

---

## Category 8: Business Mail APIs

### GET /categorized-mails/all
**Purpose:** Get all categorised business emails.

**Auth required:** 🔓 Public

**Response 200:** Array of mail objects (same structure as dashboard-sections items)

---

### GET /categorized-mails/dashboard-sections
**Purpose:** Get mails grouped into 4 UI sections for BusinessMailCenter.

**Auth required:** 🔓 Public

**Response 200:**
```json
{
  "sections": [
    {
      "title": "📅 Appointments",
      "category": "Appointment",
      "mails": [
        {
          "id": 1,
          "sender": "client@company.com",
          "subject": "Meeting Request — Q2 Review",
          "category": "Appointment",
          "priority": "HIGH",
          "auto_reply_sent": 1,
          "draft_status": "draft",
          "processed_at": "2026-03-09 09:15:00"
        }
      ]
    }
  ]
}
```

---

### GET /categorized-mails/{category}
**Purpose:** Get all mails in a specific category.

**Auth required:** 🔓 Public

**Path param:** `category` — one of: `Appointment` | `Resignation` | `Billing` | `Logistics` | `BankStatement` | `Support` | `Uncategorized`

---

### GET /draft/{mail_id}
**Purpose:** Get the draft reply body for a specific mail.

**Auth required:** 🔓 Public

**Path param:** `mail_id` — integer

**Response 200:**
```json
{
  "id": 1,
  "sender": "client@company.com",
  "subject": "Meeting Request",
  "draft_body": "Dear client@company.com,\n\nThank you for reaching out...",
  "draft_status": "draft"
}
```

---

### POST /draft/send/{mail_id}
**Purpose:** Send the draft reply via SMTP and mark it as sent.

**Auth required:** 🔓 Public

**Path param:** `mail_id` — integer

**Response 200:**
```json
{ "status": "sent", "mail_id": 1 }
```

**Response 404:**
```json
{ "detail": "Mail not found" }
```

---

## Category 9: System APIs

### GET /
**Purpose:** Health check — returns system status and feature flags.

**Auth required:** 🔓 Public

**Response 200:**
```json
{
  "message": "AI AgenticHire API v4.0",
  "features": {
    "auth": true,
    "business_mail": true,
    "analytics": true,
    "notifications": true,
    "export": true
  },
  "email_agent": {
    "enabled": false,
    "email": "monitored@gmail.com",
    "ats_threshold": 70
  }
}
```

---

## Quick Reference Table

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /auth/login | Login → JWT token | 🔓 |
| POST | /auth/register | Create new user | 🔓 |
| GET | /auth/me | Validate token | 🔐 |
| GET | /auth/users | List all users | 🔐 |
| POST | /analyze | Analyse resume file | 🔓 |
| GET | /job-roles | List predefined roles | 🔓 |
| GET | /candidates | All candidates | 🔓 |
| POST | /start-email-agent | Start agent thread | 🔓 |
| GET | /email-agent-status | Agent status + stats | 🔓 |
| GET | /agent-log | Last 20 log entries | 🔓 |
| POST | /block-sender/{email} | Block sender | 🔓 |
| POST | /unblock-sender/{email} | Unblock sender | 🔓 |
| POST | /update-ats-threshold/{n} | Change ATS threshold | 🔓 |
| GET | /analytics/summary | 6 aggregate stats | 🔓 |
| GET | /analytics/candidates-per-day | 7-day chart data | 🔓 |
| GET | /analytics/score-distribution | 5-bucket histogram | 🔓 |
| GET | /analytics/mail-categories | Pie chart data | 🔓 |
| GET | /analytics/top-job-roles | Top 6 roles | 🔓 |
| GET | /notifications | Full 24h feed | 🔓 |
| GET | /notifications/count | Badge count (1h) | 🔓 |
| GET | /export/candidates.csv | Download CSV | 🔓 |
| GET | /export/business-mails.csv | Download CSV | 🔓 |
| GET | /categorized-mails/all | All business mails | 🔓 |
| GET | /categorized-mails/dashboard-sections | Grouped sections | 🔓 |
| GET | /categorized-mails/{category} | Filter by category | 🔓 |
| GET | /draft/{mail_id} | Get draft body | 🔓 |
| POST | /draft/send/{mail_id} | Send draft reply | 🔓 |
| GET | / | Health check | 🔓 |