import unittest
from datetime import datetime

from app import create_app
from infrastructure.clock import FakeClock
from infrastructure.repositories.in_memory_session_repository import InMemorySessionRepository


class AppApiTest(unittest.TestCase):
    def setUp(self):
        self.repository = InMemorySessionRepository()
        self.app = create_app(
            repository=self.repository,
            clock=FakeClock(datetime.fromisoformat("2026-05-07T09:00:00+09:00")),
        )
        self.client = self.app.test_client()

    def test_get_settings_returns_fixed_values(self):
        response = self.client.get("/api/settings")

        self.assertEqual(200, response.status_code)
        self.assertEqual(
            {
                "work_sec": 1500,
                "short_break_sec": 300,
                "long_break_sec": 900,
                "long_break_every": 4,
            },
            response.get_json(),
        )

    def test_post_sessions_and_today_stats_work_together(self):
        response = self.client.post(
            "/api/sessions",
            json={
                "mode": "work",
                "duration_sec": 1500,
                "completed_at": "2026-05-07T10:30:00+09:00",
            },
        )
        stats_response = self.client.get("/api/stats/today")

        self.assertEqual(201, response.status_code)
        self.assertEqual("accepted", response.get_json()["status"])
        self.assertEqual(
            {"completed_sessions": 1, "focus_minutes": 25},
            stats_response.get_json(),
        )

    def test_post_sessions_returns_400_for_invalid_payload(self):
        response = self.client.post(
            "/api/sessions",
            json={
                "mode": "bad",
                "duration_sec": 0,
                "completed_at": "invalid",
            },
        )

        self.assertEqual(400, response.status_code)
        self.assertIn("mode must be one of", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()