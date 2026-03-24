"""
label_manager.py — Simulates Gmail folder/label assignment via IMAP.

Gmail exposes labels as IMAP mailboxes.  Moving a message to a label is
done by COPY + STORE \\Deleted + EXPUNGE on the source, which is the
standard IMAP "move" idiom that Gmail supports.

For environments where IMAP access is unavailable (unit-testing etc.)
every method degrades gracefully and logs a warning instead of raising.
"""

import imaplib
import logging

logger = logging.getLogger(__name__)

# All labels the system will create / use
REQUIRED_LABELS = [
    "Resume",
    "HR_Appointments",
    "HR_Resignations",
    "Finance_Billing",
    "Logistics",
    "Finance_Statements",
    "Support",
]


def ensure_labels_exist(imap_conn: imaplib.IMAP4_SSL) -> dict:
    """
    Check which labels already exist; create any that are missing.

    Returns a dict of {label_name: status} where status is
    'created', 'exists', or 'error'.
    """
    results = {}
    try:
        typ, mailbox_list = imap_conn.list()
        existing_raw = " ".join(
            m.decode() if isinstance(m, bytes) else str(m)
            for m in (mailbox_list or [])
        ).lower()

        for label in REQUIRED_LABELS:
            if label.lower() in existing_raw:
                results[label] = "exists"
            else:
                typ, data = imap_conn.create(label)
                if typ == "OK":
                    results[label] = "created"
                    logger.info(f"Created Gmail label: {label}")
                else:
                    results[label] = "error"
                    logger.warning(f"Could not create label '{label}': {data}")
    except Exception as exc:
        logger.warning(f"ensure_labels_exist failed: {exc}")

    return results


def apply_label(imap_conn: imaplib.IMAP4_SSL, uid: str, label: str) -> bool:
    """
    Move an email (identified by UID) to a Gmail label.

    Strategy:
      1. SELECT INBOX
      2. UID COPY  <uid>  <label>
      3. UID STORE <uid>  +FLAGS (\\Deleted)
      4. EXPUNGE

    Returns True on success, False on failure.
    """
    if not imap_conn or not uid or not label:
        return False
    try:
        imap_conn.select("INBOX")
        result, _ = imap_conn.uid("COPY", uid, label)
        if result != "OK":
            logger.warning(f"COPY to '{label}' failed for UID {uid}")
            return False
        imap_conn.uid("STORE", uid, "+FLAGS", "(\\Deleted)")
        imap_conn.expunge()
        logger.info(f"Moved UID {uid} → label '{label}'")
        return True
    except Exception as exc:
        logger.warning(f"apply_label failed for UID {uid}: {exc}")
        return False


def get_imap_connection(email_address: str, password: str,
                        imap_server: str = "imap.gmail.com") -> imaplib.IMAP4_SSL | None:
    """
    Helper: open an authenticated IMAP connection.
    Returns None if connection fails.
    """
    try:
        conn = imaplib.IMAP4_SSL(imap_server)
        conn.login(email_address, password)
        return conn
    except Exception as exc:
        logger.error(f"IMAP login failed: {exc}")
        return None
