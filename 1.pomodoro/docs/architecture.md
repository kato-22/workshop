# アーキテクチャ概要（現行実装）

このドキュメントは `1.pomodoro/` 配下の実装コードに同期した構成説明です。

## 全体構成

- バックエンド: Flask（`app.py`）
- フロントエンド: ES Modules（`static/js/*.js`）+ テンプレート（`templates/index.html`）
- 永続化: SQLite（`infrastructure/repositories/sqlite_session_repository.py`）

リアルタイムのタイマー進行はブラウザ側で処理し、サーバー側は設定提供・完了セッション記録・当日統計返却を担当します。

## レイヤー

### Presentation

- `app.py`: ルーティング、依存注入、エラーハンドリング
- `templates/index.html`: 画面構造
- `static/css/style.css`: 画面スタイル
- `static/js/ui.js`: DOM 描画

### Application / Service

- `services/settings_service.py`: 固定設定の返却
- `services/session_service.py`: セッション記録ユースケースとバリデーション
- `services/stats_service.py`: 当日統計取得

### Infrastructure

- `infrastructure/clock.py`: `SystemClock` / `FakeClock`
- `infrastructure/repositories/session_repository.py`: Repository 抽象
- `infrastructure/repositories/sqlite_session_repository.py`: SQLite 実装
- `infrastructure/repositories/in_memory_session_repository.py`: テスト用実装

## 依存関係

- `app.py` は Repository と Clock を生成または受け取り、Flask `config` に保持
- Service は Repository 抽象に依存
- Repository 実装は SQLite またはインメモリで差し替え可能

## 初期化

`create_app()` 起動時に以下を実行します。

1. Repository を構築（デフォルト: `data/pomodoro.db`）
2. Clock を構築（デフォルト: `SystemClock`）
3. `repository.initialize()` で `sessions` テーブルを準備

## エラーハンドリング

- `ValidationError` をグローバルに捕捉し、HTTP 400 + JSON を返却
