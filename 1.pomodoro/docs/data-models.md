# データモデル仕様

## 1. セッション記録モデル

`services/session_service.py` で扱う完了セッション入力:

- `mode: str`
  - 許可値: `work`, `short_break`, `long_break`
- `duration_sec: int`
  - 正の整数
- `completed_at: str`
  - ISO 8601 日時文字列

内部的には以下の形式で返却されます。

````json
{
  "id": 1,
  "mode": "work",
  "duration_sec": 1500,
  "completed_at": "2026-05-07T10:30:00+09:00"
}
````

## 2. 統計モデル

`services/stats_service.py` / Repository が返す当日統計:

````json
{
  "completed_sessions": 0,
  "focus_minutes": 0
}
````

- `completed_sessions`: 当日 `work` セッション件数
- `focus_minutes`: 当日 `work` の `duration_sec` 合計を 60 で割った分

## 3. Repository インターフェース

`SessionRepository` は次の 3 メソッドを持ちます。

- `initialize() -> None`
- `create_session(mode: str, duration_sec: int, completed_at: str) -> int`
- `get_work_stats_for_day(day_key: str) -> dict[str, int]`

## 4. SQLite テーブル

`SQLiteSessionRepository.initialize()` が作成するスキーマ:

````sql
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  completed_at TEXT NOT NULL
)
````

### 集計条件

当日統計は SQL の `substr(completed_at, 1, 10) = ?` で日付一致判定します。
