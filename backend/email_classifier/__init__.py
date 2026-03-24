# """
# email_classifier — plug-in classification layer for non-resume emails.
# """

# from .classifier import classify_email, is_resume_email
# from .draft_generator import generate_draft, draft_metadata
# from .category_rules import CATEGORY_RULES, CATEGORY_DISPLAY_NAMES, DASHBOARD_SECTIONS
# from .models import (
#     init_categorized_mail_table,
#     save_categorized_mail,
#     get_mails_by_category,
#     get_all_mails,
#     get_mail_by_id,
#     mark_draft_sent,
# )

# __all__ = [
#     "classify_email",
#     "is_resume_email",
#     "generate_draft",
#     "draft_metadata",
#     "CATEGORY_RULES",
#     "CATEGORY_DISPLAY_NAMES",
#     "DASHBOARD_SECTIONS",
#     "init_categorized_mail_table",
#     "save_categorized_mail",
#     "get_mails_by_category",
#     "get_all_mails",
#     "get_mail_by_id",
#     "mark_draft_sent",
# ]

"""
email_classifier — plug-in classification layer for non-resume emails.
"""

from .classifier import classify_email, is_resume_email
from .draft_generator import generate_draft, draft_metadata
from .category_rules import CATEGORY_RULES, CATEGORY_DISPLAY_NAMES, DASHBOARD_SECTIONS
from .models import (
    init_categorized_mail_table,
    save_categorized_mail,
    get_mails_by_category,
    get_all_mails,
    get_mail_by_id,
    mark_draft_sent,
    mark_auto_reply_sent,
)

__all__ = [
    "classify_email",
    "is_resume_email",
    "generate_draft",
    "draft_metadata",
    "CATEGORY_RULES",
    "CATEGORY_DISPLAY_NAMES",
    "DASHBOARD_SECTIONS",
    "init_categorized_mail_table",
    "save_categorized_mail",
    "get_mails_by_category",
    "get_all_mails",
    "get_mail_by_id",
    "mark_draft_sent",
    "mark_auto_reply_sent",
]