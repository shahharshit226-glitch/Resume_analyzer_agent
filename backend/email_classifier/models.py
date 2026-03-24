# """
# models.py — DB schema and helpers for categorized (non-resume) emails.

# Uses the SAME candidates.db file via a separate table so no new DB
# connection configuration is needed.  Completely isolated from the
# candidates table used by the resume pipeline.
# """

# import sqlite3
# import os
# from datetime import datetime

# DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "candidates.db")


# def get_db():
#     conn = sqlite3.connect(DB_PATH, check_same_thread=False)
#     conn.row_factory = sqlite3.Row
#     return conn


# def init_categorized_mail_table():
#     """Create the categorized_mails table if it does not already exist."""
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         """
#         CREATE TABLE IF NOT EXISTS categorized_mails (
#             id          INTEGER PRIMARY KEY AUTOINCREMENT,
#             sender      TEXT    NOT NULL,
#             subject     TEXT    NOT NULL,
#             snippet     TEXT,
#             category    TEXT    NOT NULL,
#             label       TEXT,
#             priority    TEXT    DEFAULT 'MEDIUM',
#             draft_body  TEXT,
#             draft_status TEXT   DEFAULT 'draft',
#             received_at TEXT,
#             processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         )
#         """
#     )
#     conn.commit()
#     conn.close()


# def save_categorized_mail(
#     sender: str,
#     subject: str,
#     snippet: str,
#     category: str,
#     label: str,
#     priority: str,
#     draft_body: str,
#     received_at: str | None = None,
# ) -> int:
#     """
#     Insert a categorized mail record.  Returns the new row id.
#     """
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         """
#         INSERT INTO categorized_mails
#             (sender, subject, snippet, category, label, priority, draft_body, received_at)
#         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
#         """,
#         (sender, subject, snippet, category, label, priority, draft_body, received_at),
#     )
#     conn.commit()
#     row_id = c.lastrowid
#     conn.close()
#     return row_id


# def get_mails_by_category(category: str) -> list[dict]:
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         """
#         SELECT id, sender, subject, snippet, category, label,
#                priority, draft_body, draft_status, received_at, processed_at
#         FROM categorized_mails
#         WHERE category = ?
#         ORDER BY processed_at DESC
#         """,
#         (category,),
#     )
#     rows = c.fetchall()
#     conn.close()
#     return [_row_to_dict(r) for r in rows]


# def get_all_mails() -> list[dict]:
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         """
#         SELECT id, sender, subject, snippet, category, label,
#                priority, draft_body, draft_status, received_at, processed_at
#         FROM categorized_mails
#         ORDER BY processed_at DESC
#         """
#     )
#     rows = c.fetchall()
#     conn.close()
#     return [_row_to_dict(r) for r in rows]


# def get_mail_by_id(mail_id: int) -> dict | None:
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         """
#         SELECT id, sender, subject, snippet, category, label,
#                priority, draft_body, draft_status, received_at, processed_at
#         FROM categorized_mails WHERE id = ?
#         """,
#         (mail_id,),
#     )
#     row = c.fetchone()
#     conn.close()
#     return _row_to_dict(row) if row else None


# def mark_draft_sent(mail_id: int) -> bool:
#     """Mark a draft as sent. Returns True if a row was updated."""
#     conn = get_db()
#     c = conn.cursor()
#     c.execute(
#         "UPDATE categorized_mails SET draft_status = 'sent' WHERE id = ?",
#         (mail_id,),
#     )
#     updated = c.rowcount > 0
#     conn.commit()
#     conn.close()
#     return updated


# # ── Internal helper ─────────────────────────────────────────────────────────

# def _row_to_dict(row) -> dict:
#     d = dict(row)
#     # Normalise timestamps
#     for key in ("processed_at",):
#         if d.get(key):
#             try:
#                 d[key] = datetime.strptime(d[key], "%Y-%m-%d %H:%M:%S").strftime(
#                     "%Y-%m-%d %H:%M"
#                 )
#             except Exception:
#                 pass
#     return d

"""
models.py — DB schema and helpers for categorized (non-resume) emails.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "business_mails.db")


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_categorized_mail_table():
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS categorized_mails (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            sender           TEXT    NOT NULL,
            subject          TEXT    NOT NULL,
            snippet          TEXT,
            category         TEXT    NOT NULL,
            label            TEXT,
            priority         TEXT    DEFAULT 'MEDIUM',
            draft_body       TEXT,
            draft_status     TEXT    DEFAULT 'draft',
            auto_reply_sent  INTEGER DEFAULT 0,
            received_at      TEXT,
            processed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    # Backward-compatible migration for legacy schema variants.
    cols = {
        row["name"] if isinstance(row, sqlite3.Row) else row[1]
        for row in c.execute("PRAGMA table_info(categorized_mails)").fetchall()
    }
    for ddl in [
        "ALTER TABLE categorized_mails ADD COLUMN sender TEXT",
        "ALTER TABLE categorized_mails ADD COLUMN snippet TEXT",
        "ALTER TABLE categorized_mails ADD COLUMN label TEXT",
        "ALTER TABLE categorized_mails ADD COLUMN draft_body TEXT",
        "ALTER TABLE categorized_mails ADD COLUMN draft_status TEXT DEFAULT 'draft'",
        "ALTER TABLE categorized_mails ADD COLUMN auto_reply_sent INTEGER DEFAULT 0",
        "ALTER TABLE categorized_mails ADD COLUMN received_at TEXT",
        "ALTER TABLE categorized_mails ADD COLUMN processed_at TEXT",
    ]:
        col_name = ddl.split("ADD COLUMN", 1)[1].strip().split()[0]
        if col_name not in cols:
            try:
                c.execute(ddl)
            except Exception:
                pass

    cols = {
        row["name"] if isinstance(row, sqlite3.Row) else row[1]
        for row in c.execute("PRAGMA table_info(categorized_mails)").fetchall()
    }
    if "from_email" in cols:
        c.execute(
            """
            UPDATE categorized_mails
            SET sender = COALESCE(sender, from_email)
            WHERE sender IS NULL OR sender = ''
            """
        )
    if "body_snippet" in cols:
        c.execute(
            """
            UPDATE categorized_mails
            SET snippet = COALESCE(snippet, body_snippet)
            WHERE snippet IS NULL OR snippet = ''
            """
        )
    c.execute(
        """
        UPDATE categorized_mails
        SET category = COALESCE(category, 'Uncategorized')
        WHERE category IS NULL OR category = ''
        """
    )
    c.execute(
        """
        UPDATE categorized_mails
        SET processed_at = COALESCE(processed_at, received_at, CURRENT_TIMESTAMP)
        WHERE processed_at IS NULL OR processed_at = ''
        """
    )
    conn.commit()
    conn.close()


def save_categorized_mail(
    sender: str,
    subject: str,
    snippet: str,
    category: str,
    label: str,
    priority: str,
    draft_body: str,
    received_at=None,
    auto_reply_sent: bool = False,
) -> int:
    conn = get_db()
    c = conn.cursor()
    cols = {
        row["name"] if isinstance(row, sqlite3.Row) else row[1]
        for row in c.execute("PRAGMA table_info(categorized_mails)").fetchall()
    }

    insert_cols = [
        "sender", "subject", "snippet", "category", "label", "priority",
        "draft_body", "received_at", "auto_reply_sent",
    ]
    values = [
        sender, subject, snippet, category, label, priority,
        draft_body, received_at, int(auto_reply_sent),
    ]

    # Legacy schema compatibility.
    if "from_email" in cols:
        insert_cols.append("from_email")
        values.append(sender)
    if "from_name" in cols:
        insert_cols.append("from_name")
        values.append("")
    if "body_snippet" in cols:
        insert_cols.append("body_snippet")
        values.append(snippet)
    if "processed_at" in cols:
        insert_cols.append("processed_at")
        values.append(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    placeholders = ",".join(["?"] * len(values))
    c.execute(
        f"""
        INSERT INTO categorized_mails ({",".join(insert_cols)})
        VALUES ({placeholders})
        """,
        values,
    )
    conn.commit()
    row_id = c.lastrowid
    conn.close()
    return row_id


def get_mails_by_category(category: str) -> list:
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """
        SELECT id, sender, subject, snippet, category, label,
               priority, draft_body, draft_status, auto_reply_sent,
               received_at, processed_at
        FROM categorized_mails
        WHERE category = ?
        ORDER BY processed_at DESC
        """,
        (category,),
    )
    rows = c.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_all_mails() -> list:
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """
        SELECT id, sender, subject, snippet, category, label,
               priority, draft_body, draft_status, auto_reply_sent,
               received_at, processed_at
        FROM categorized_mails
        ORDER BY processed_at DESC
        """
    )
    rows = c.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_mail_by_id(mail_id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """
        SELECT id, sender, subject, snippet, category, label,
               priority, draft_body, draft_status, auto_reply_sent,
               received_at, processed_at
        FROM categorized_mails WHERE id = ?
        """,
        (mail_id,),
    )
    row = c.fetchone()
    conn.close()
    return _row_to_dict(row) if row else None


def mark_draft_sent(mail_id: int) -> bool:
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "UPDATE categorized_mails SET draft_status = 'sent' WHERE id = ?",
        (mail_id,),
    )
    updated = c.rowcount > 0
    conn.commit()
    conn.close()
    return updated


def mark_auto_reply_sent(mail_id: int) -> bool:
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "UPDATE categorized_mails SET auto_reply_sent = 1 WHERE id = ?",
        (mail_id,),
    )
    updated = c.rowcount > 0
    conn.commit()
    conn.close()
    return updated


def _row_to_dict(row) -> dict:
    d = dict(row)
    for key in ("processed_at",):
        if d.get(key):
            try:
                d[key] = datetime.strptime(d[key], "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d %H:%M")
            except Exception:
                pass
    d["auto_reply_sent"] = bool(d.get("auto_reply_sent", 0))
    return d
