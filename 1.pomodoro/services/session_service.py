from datetime import datetime

from infrastructure.repositories.session_repository import SessionRepository


VALID_MODES = {"work", "short_break", "long_break"}


class ValidationError(ValueError):
    pass


def record_completed_session(payload: dict | None, repository: SessionRepository) -> dict:
    validated_payload = validate_session_payload(payload)
    session_id = repository.create_session(
        mode=validated_payload["mode"],
        duration_sec=validated_payload["duration_sec"],
        completed_at=validated_payload["completed_at"],
    )

    return {
        "status": "accepted",
        "session": {
            "id": session_id,
            **validated_payload,
        },
    }


def validate_session_payload(payload: dict | None) -> dict:
    if not isinstance(payload, dict):
        raise ValidationError("JSON body is required.")

    mode = payload.get("mode")
    duration_sec = payload.get("duration_sec")
    completed_at = payload.get("completed_at")

    if mode not in VALID_MODES:
        raise ValidationError("mode must be one of: work, short_break, long_break.")

    if not isinstance(duration_sec, int) or duration_sec <= 0:
        raise ValidationError("duration_sec must be a positive integer.")

    if not isinstance(completed_at, str) or not completed_at.strip():
        raise ValidationError("completed_at must be a non-empty ISO 8601 string.")

    try:
        datetime.fromisoformat(completed_at)
    except ValueError as exc:
        raise ValidationError("completed_at must be a valid ISO 8601 datetime.") from exc

    return {
        "mode": mode,
        "duration_sec": duration_sec,
        "completed_at": completed_at,
    }