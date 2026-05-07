from __future__ import annotations

from infrastructure.repositories.session_repository import SessionRepository


class InMemorySessionRepository(SessionRepository):
    def __init__(self):
        self._sessions: list[dict] = []
        self._next_id = 1

    def initialize(self) -> None:
        return None

    def create_session(self, mode: str, duration_sec: int, completed_at: str) -> int:
        session_id = self._next_id
        self._next_id += 1
        self._sessions.append(
            {
                "id": session_id,
                "mode": mode,
                "duration_sec": duration_sec,
                "completed_at": completed_at,
            }
        )
        return session_id

    def get_work_stats_for_day(self, day_key: str) -> dict[str, int]:
        day_sessions = [
            session
            for session in self._sessions
            if session["mode"] == "work" and session["completed_at"][:10] == day_key
        ]
        total_duration_sec = sum(session["duration_sec"] for session in day_sessions)
        return {
            "completed_sessions": len(day_sessions),
            "focus_minutes": total_duration_sec // 60,
        }