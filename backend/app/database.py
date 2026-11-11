import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import settings
from app.models.schemas import UserPalateMemory


def get_connection(db_path: Path | None = None) -> sqlite3.Connection:
    target = db_path or settings.DATABASE_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path | None = None) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_memory TEXT NOT NULL DEFAULT '{}',
                chat_history TEXT NOT NULL DEFAULT '[]',
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                order_number TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                items_json TEXT NOT NULL,
                coupon_code TEXT,
                subtotal REAL NOT NULL,
                discount_amount REAL NOT NULL,
                shipping_cost REAL NOT NULL,
                total REAL NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                email TEXT PRIMARY KEY,
                subscribed_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def get_session(session_id: str, db_path: Path | None = None) -> dict[str, Any]:
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT user_memory, chat_history FROM sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        if not row:
            return {"userMemory": UserPalateMemory(), "messages": []}
        try:
            mem_data = json.loads(row["user_memory"])
            memory = UserPalateMemory(**mem_data)
        except Exception:
            memory = UserPalateMemory()
        try:
            messages = json.loads(row["chat_history"])
            if not isinstance(messages, list):
                messages = []
        except Exception:
            messages = []
        return {"userMemory": memory, "messages": messages}


def save_session(
    session_id: str,
    user_memory: UserPalateMemory,
    messages: list[dict[str, Any]] | None = None,
    db_path: Path | None = None,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection(db_path) as conn:
        existing = conn.execute(
            "SELECT chat_history FROM sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        if messages is None:
            history_json = existing["chat_history"] if existing else "[]"
        else:
            history_json = json.dumps(messages[-20:], ensure_ascii=False)

        conn.execute(
            """
            INSERT INTO sessions (session_id, user_memory, chat_history, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                user_memory = excluded.user_memory,
                chat_history = excluded.chat_history,
                updated_at = excluded.updated_at
            """,
            (
                session_id,
                user_memory.model_dump_json(),
                history_json,
                now,
            ),
        )
        conn.commit()


def clear_session_chat(session_id: str, db_path: Path | None = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection(db_path) as conn:
        conn.execute(
            "UPDATE sessions SET chat_history = '[]', updated_at = ? WHERE session_id = ?",
            (now, session_id),
        )
        conn.commit()


def clear_session_memory(session_id: str, db_path: Path | None = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection(db_path) as conn:
        conn.execute(
            "UPDATE sessions SET user_memory = '{}', updated_at = ? WHERE session_id = ?",
            (now, session_id),
        )
        conn.commit()


def save_order(
    order_number: str,
    email: str,
    items: list[dict[str, Any]],
    coupon_code: str | None,
    subtotal: float,
    discount_amount: float,
    shipping_cost: float,
    total: float,
    db_path: Path | None = None,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection(db_path) as conn:
        conn.execute(
            """
            INSERT INTO orders (
                order_number, email, items_json, coupon_code,
                subtotal, discount_amount, shipping_cost, total, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_number,
                email,
                json.dumps(items, ensure_ascii=False),
                coupon_code,
                subtotal,
                discount_amount,
                shipping_cost,
                total,
                now,
            ),
        )
        conn.commit()


def save_subscriber(email: str, db_path: Path | None = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection(db_path) as conn:
        conn.execute(
            """
            INSERT INTO newsletter_subscribers (email, subscribed_at)
            VALUES (?, ?)
            ON CONFLICT(email) DO NOTHING
            """,
            (email.strip().lower(), now),
        )
        conn.commit()

