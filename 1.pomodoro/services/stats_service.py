from __future__ import annotations

from datetime import datetime

from infrastructure.repositories.session_repository import SessionRepository


def get_today_stats(repository: SessionRepository, now: datetime | None = None) -> dict[str, int]:
    current_time = now or datetime.now().astimezone()
    day_key = current_time.date().isoformat()
    return repository.get_work_stats_for_day(day_key)