# API リファレンス

このドキュメントは `1.pomodoro/app.py` の実装に基づく現行 API 仕様です。

## 共通

- レスポンス形式: JSON（`GET /` を除く）
- エラー形式: `{"error": "..."}`（`ValidationError` 発生時に 400）

## `GET /`

トップページを返します。

- ステータス: `200 OK`
- レスポンス: `templates/index.html` の HTML

## `GET /api/settings`

固定のタイマー設定を返します（`services/settings_service.py`）。

- ステータス: `200 OK`

レスポンス例:

````json
{
  "work_sec": 1500,
  "short_break_sec": 300,
  "long_break_sec": 900,
  "long_break_every": 4
}
````

## `GET /api/stats/today`

当日の作業セッション統計を返します（`services/stats_service.py`）。
`CLOCK.now()` の日付（`YYYY-MM-DD`）をキーに集計します。

- ステータス: `200 OK`

レスポンス例:

````json
{
  "completed_sessions": 3,
  "focus_minutes": 75
}
````

- `completed_sessions`: `mode == "work"` の当日完了件数
- `focus_minutes`: 当日の `work` セッション `duration_sec` 合計を分換算（切り捨て）

## `POST /api/sessions`

完了セッションを 1 件保存します（`services/session_service.py`）。

- ステータス: `201 Created`（成功時）
- ステータス: `400 Bad Request`（バリデーションエラー）

リクエスト例:

````json
{
  "mode": "work",
  "duration_sec": 1500,
  "completed_at": "2026-05-07T10:30:00+09:00"
}
````

### バリデーション

- Body は JSON オブジェクト必須
- `mode`: `work | short_break | long_break`
- `duration_sec`: 正の整数
- `completed_at`: 空でない ISO 8601 文字列（`datetime.fromisoformat` で検証）

成功レスポンス例:

````json
{
  "status": "accepted",
  "session": {
    "id": 12,
    "mode": "work",
    "duration_sec": 1500,
    "completed_at": "2026-05-07T10:30:00+09:00"
  }
}
````

エラーレスポンス例:

````json
{
  "error": "mode must be one of: work, short_break, long_break."
}
````
