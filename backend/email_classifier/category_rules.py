"""
Keyword-based category rules for email classification.
All matching is done on subject line (lowercased).
"""

CATEGORY_RULES = {
    "Appointment": {
        "keywords": ["interview", "schedule", "meeting", "appointment", "call", "slot", "availability", "discussion"],
        "label": "HR_Appointments",
        "priority": "HIGH",
    },
    "Resignation": {
        "keywords": ["resign", "resignation", "notice", "leaving", "last working", "last day", "stepping down", "quit"],
        "label": "HR_Resignations",
        "priority": "HIGH",
    },
    "Billing": {
        "keywords": ["invoice", "payment", "bill", "quotation", "quote", "receipt", "purchase order", "pro forma", "due"],
        "label": "Finance_Billing",
        "priority": "MEDIUM",
    },
    "Logistics": {
        "keywords": ["shipment", "delivery", "dispatch", "tracking", "courier", "cargo", "freight", "logistics", "order shipped"],
        "label": "Logistics",
        "priority": "MEDIUM",
    },
    "BankStatement": {
        "keywords": ["statement", "transaction", "bank", "remittance", "transfer", "account summary", "balance", "debit", "credit"],
        "label": "Finance_Statements",
        "priority": "LOW",
    },
    "Support": {
        "keywords": ["issue", "help", "support", "error", "problem", "bug", "ticket", "complaint", "assistance", "trouble"],
        "label": "Support",
        "priority": "MEDIUM",
    },
}

# Human-friendly display names for each category
CATEGORY_DISPLAY_NAMES = {
    "Appointment":    "📅 Appointments & Interviews",
    "Resignation":    "🚪 Resignations",
    "Billing":        "💳 Invoices & Billing",
    "Logistics":      "📦 Shipping & Logistics",
    "BankStatement":  "🏦 Bank & Financial Statements",
    "Support":        "🛠️ Support & Service Inquiries",
    "Uncategorized":  "📬 Uncategorized",
}

# Dashboard section groupings
DASHBOARD_SECTIONS = {
    "HR":       ["Appointment", "Resignation"],
    "Finance":  ["Billing", "BankStatement"],
    "Logistics":["Logistics"],
    "Support":  ["Support"],
}