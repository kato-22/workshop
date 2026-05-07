# フロントエンド実装ドキュメント

対象: `static/js/`, `static/css/style.css`, `templates/index.html`

## モジュール構成

### `state.js`

タイマー状態と純粋関数ベースの状態遷移を提供します。

- 定数: `TIMER_MODES`, `TIMER_ACTIONS`, `defaultSettings`
- 主関数:
  - `createInitialState()`
  - `reduceTimerState(state, action)`
  - `getModeDuration()`
  - `getNextMode()`
  - `calculateRemainingSec()`

状態モデル:

````js
{
  mode,
  isRunning,
  durationSec,
  remainingSec,
  startedAt,
  cycleCount,
  settings
}
````

### `timer.js`

タイマーの実行制御と API 連携を担当します。

- `createTimer()`
  - `START/PAUSE/RESET/TICK/SET_SETTINGS` を dispatch
  - `setInterval`（既定 250ms）で tick
- 完了検知 (`didSessionComplete`) 後:
  1. `POST /api/sessions`
  2. `GET /api/stats/today` を再取得
- 初期化時:
  - `GET /api/settings` を取得して設定反映
  - `GET /api/stats/today` を取得して進捗表示

### `ui.js`

DOM 描画を担当します。

- モード文言: `作業中 / 短い休憩 / 長い休憩`
- ボタン文言: `開始 / 一時停止 / 再開`
- 進捗リング: `--progress-deg` と `is-break` クラスで更新
- 統計表示: `completed_sessions`, `focus_minutes`（`X時間Y分` 形式）

### `api.js`

バックエンド通信を担当します。

- `fetchSettings()`
- `fetchTodayStats()`
- `createCompletedSession(session)`

いずれも `response.ok` を確認し、失敗時は `Error` を throw します。

## テンプレート (`templates/index.html`)

主要要素 ID:

- `#timer-mode-label`
- `#timer-value`
- `#timer-ring`
- `#start-button`
- `#reset-button`
- `#completed-sessions-value`
- `#focus-minutes-value`

`type="module"` で `state.js`, `timer.js`, `ui.js`, `api.js` を読み込みます。

## スタイル (`static/css/style.css`)

- 単一カード UI（タイマー + 当日進捗）
- conic-gradient ベースの円形プログレス
- ブレーク時カラー切り替え（`.timer-ring.is-break`）
- 520px 以下でのレスポンシブ調整
