"""
Deterministic keyword-based email classifier for business mail routing.

Returns categories from CATEGORY_RULES:
Appointment | Resignation | Billing | Logistics | BankStatement | Support | Uncategorized
"""

import re
from typing import Optional

from .category_rules import CATEGORY_RULES

# Job role patterns for resume emails
JOB_ROLE_PATTERNS = [
    (r"(?:applying|application)\s+(?:for|as)\s+(?:the\s+)?(.+?)(?:\s+(?:role|position|job|opening|vacancy))?$", "full"),
    (r"(?:interested in|seeking|looking for)\s+(?:the\s+)?(.+?)(?:\s+(?:role|position|job))?$", "full"),
    (r"(.+?)\s+(?:role|position|job|opening|vacancy|opportunity)", "group"),
    (r"(?:re:|fw:)?\s*(?:resume|cv|curriculum vitae)\s*[-–—:]\s*(.+)", "after_dash"),
]

KNOWN_ROLES = [
    "software engineer", "data scientist", "product manager", "ui ux designer",
    "devops engineer", "full stack developer", "frontend developer", "backend developer",
    "data analyst", "machine learning engineer", "ml engineer", "business analyst",
    "project manager", "qa engineer", "android developer", "ios developer",
    "cloud engineer", "security engineer", "data engineer", "ai engineer",
    "web developer", "mobile developer", "solutions architect", "system architect",
]


def classify_email(subject: str, body_snippet: str = "") -> str:
    """
    Deterministically classify an email by keyword scoring.
    Subject matches are weighted higher than body snippet matches.
    """
    subject_lower = (subject or "").lower()
    body_lower = (body_snippet or "").lower()
    if not subject_lower and not body_lower:
        return "Uncategorized"

    category_order = list(CATEGORY_RULES.keys())
    scores = {cat: 0 for cat in category_order}

    for cat in category_order:
        keywords = CATEGORY_RULES[cat].get("keywords", [])
        for kw in keywords:
            kw_lower = kw.lower()

            if " " in kw_lower:
                subject_hit = kw_lower in subject_lower
                body_hit = kw_lower in body_lower
            else:
                pattern = r"\b" + re.escape(kw_lower) + r"\b"
                subject_hit = bool(re.search(pattern, subject_lower))
                body_hit = bool(re.search(pattern, body_lower))

            if subject_hit:
                scores[cat] += 3
            elif body_hit:
                scores[cat] += 1

    ranked = sorted(
        scores.items(),
        key=lambda item: (-item[1], category_order.index(item[0]))
    )
    best_category, best_score = ranked[0]
    return best_category if best_score > 0 else "Uncategorized"


def extract_job_role_from_email(subject: str, body_snippet: str = "") -> Optional[str]:
    """
    Extract job role from resume email subject/body.
    Returns a role string or None if not found.
    """
    text = (subject + " " + body_snippet).lower()

    for role in KNOWN_ROLES:
        if role in text:
            return role.title()

    for pattern, _mode in JOB_ROLE_PATTERNS:
        match = re.search(pattern, subject.lower(), re.IGNORECASE)
        if match:
            role = match.group(1).strip().title()
            if 3 <= len(role) <= 60:
                return role

    return None


def get_category_config(category: str) -> dict:
    """Return label/priority metadata for a category."""
    defaults = {"label": "Support", "priority": "LOW"}
    config = CATEGORY_RULES.get(category)
    return config if config else defaults


def is_resume_email(subject: str, has_attachment: bool) -> bool:
    """
    Determine if an email is a resume submission.
    Used by EmailAgent before running full analysis.
    """
    subject_lower = (subject or "").lower()
    resume_keywords = [
        "resume", "cv", "curriculum vitae", "job application",
        "application for", "applying for", "cover letter", "portfolio", "candidature"
    ]
    return any(kw in subject_lower for kw in resume_keywords) or (
        has_attachment and "application" in subject_lower
    )


def log_classification(sender: str, subject: str, category: str, job_role: Optional[str] = None):
    """Log classification result for debugging."""
    role_info = f" | Job Role: {job_role}" if job_role else ""
    print(f"[EmailClassifier] {sender} | Subject: '{subject[:60]}' -> {category}{role_info}")
