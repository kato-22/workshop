from __future__ import annotations

import sqlite3
from pathlib import Path

from infrastructure.repositories.session_repository import SessionRepository


class SQLiteSessionRepository(SessionRepository):
    def __init__(self, database_path: Path):
        self._database_path = database_path

    def initialize(self) -> None:
        self._database_path.parent.mkdir(parents=True, exist_ok=True)

        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mode TEXT NOT NULL,
                    duration_sec INTEGER NOT NULL,
                    completed_at TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def create_session(self, mode: str, duration_sec: int, completed_at: str) -> int:
        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO sessions (mode, duration_sec, completed_at)
                VALUES (?, ?, ?)
                """,
                (mode, duration_sec, completed_at),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_work_stats_for_day(self, day_key: str) -> dict[str, int]:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT COUNT(*) AS completed_sessions,
                       COALESCE(SUM(duration_sec), 0) AS total_duration_sec
                FROM sessions
                WHERE mode = 'work'
                  AND substr(completed_at, 1, 10) = ?
                """,
                (day_key,),
            ).fetchone()

        total_duration_sec = int(row["total_duration_sec"])
        return {
            "completed_sessions": int(row["completed_sessions"]),
            "focus_minutes": total_duration_sec // 60,
        }

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._database_path)
        connection.row_factory = sqlite3.Row
        return connection