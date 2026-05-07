DEFAULT_SETTINGS = {
    "work_sec": 1500,
    "short_break_sec": 300,
    "long_break_sec": 900,
    "long_break_every": 4,
}


def get_timer_settings() -> dict[str, int]:
    return DEFAULT_SETTINGS.copy()