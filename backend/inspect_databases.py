import os
import sqlite3
from typing import Iterable


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASES = {
    "candidates": os.path.join(BASE_DIR, "candidates.db"),
    "business_mails": os.path.join(BASE_DIR, "business_mails.db"),
}


def fetch_all(conn: sqlite3.Connection, query: str, params: Iterable = ()):
    cur = conn.execute(query, tuple(params))
    return cur.fetchall()


def print_db_summary(name: str, path: str) -> None:
    print(f"\n=== {name} ===")
    print(path)

    if not os.path.exists(path):
        print("Database file not found.")
        return

    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row

    try:
        tables = fetch_all(
            conn,
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        if not tables:
            print("No tables found.")
            return

        for table_row in tables:
            table_name = table_row["name"]
            count = fetch_all(conn, f"SELECT COUNT(*) AS count FROM {table_name}")[0]["count"]
            print(f"\nTable: {table_name} ({count} rows)")

            columns = fetch_all(conn, f"PRAGMA table_info({table_name})")
            print("Columns:", ", ".join(col["name"] for col in columns))

            sample_rows = fetch_all(conn, f"SELECT * FROM {table_name} ORDER BY rowid DESC LIMIT 5")
            if not sample_rows:
                print("No rows.")
                continue

            print("Sample rows:")
            for row in sample_rows:
                print(dict(row))
    finally:
        conn.close()


def main() -> None:
    for name, path in DATABASES.items():
        print_db_summary(name, path)


if __name__ == "__main__":
    main()
