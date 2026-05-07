from __future__ import annotations

from abc import ABC, abstractmethod


class SessionRepository(ABC):
    @abstractmethod
    def initialize(self) -> None:
        pass

    @abstractmethod
    def create_session(self, mode: str, duration_sec: int, completed_at: str) -> int:
        pass

    @abstractmethod
    def get_work_stats_for_day(self, day_key: str) -> dict[str, int]:
        pass