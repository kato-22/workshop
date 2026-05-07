import unittest

from infrastructure.repositories.in_memory_session_repository import InMemorySessionRepository
from services.session_service import ValidationError, record_completed_session


class RecordCompletedSessionTest(unittest.TestCase):
    def test_record_completed_session_persists_valid_payload(self):
        repository = InMemorySessionRepository()

        result = record_completed_session(
            {
                "mode": "work",
                "duration_sec": 1500,
                "completed_at": "2026-05-07T10:30:00+09:00",
            },
            repository,
        )

        self.assertEqual("accepted", result["status"])
        self.assertEqual(1, result["session"]["id"])
        self.assertEqual(
            {"completed_sessions": 1, "focus_minutes": 25},
            repository.get_work_stats_for_day("2026-05-07"),
        )

    def test_record_completed_session_rejects_invalid_mode(self):
        repository = InMemorySessionRepository()

        with self.assertRaises(ValidationError):
            record_completed_session(
                {
                    "mode": "invalid",
                    "duration_sec": 1500,
                    "completed_at": "2026-05-07T10:30:00+09:00",
                },
                repository,
            )


if __name__ == "__main__":
    unittest.main()