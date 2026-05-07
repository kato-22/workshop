import unittest
from datetime import datetime

from infrastructure.repositories.in_memory_session_repository import InMemorySessionRepository
from services.stats_service import get_today_stats


class GetTodayStatsTest(unittest.TestCase):
    def test_get_today_stats_aggregates_only_todays_work_sessions(self):
        repository = InMemorySessionRepository()
        repository.create_session("work", 1500, "2026-05-07T09:00:00+09:00")
        repository.create_session("short_break", 300, "2026-05-07T09:30:00+09:00")
        repository.create_session("work", 1500, "2026-05-06T09:00:00+09:00")

        result = get_today_stats(
            repository,
            datetime.fromisoformat("2026-05-07T21:00:00+09:00"),
        )

        self.assertEqual({"completed_sessions": 1, "focus_minutes": 25}, result)


if __name__ == "__main__":
    unittest.main()