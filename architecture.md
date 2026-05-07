# ポモドーロタイマー Web アプリケーションアーキテクチャ案

## 1. 目的

このプロジェクトでは、Flask と HTML/CSS/JavaScript を用いて、単一画面中心のポモドーロタイマー Web アプリを実装する。

設計方針は次の 3 点を重視する。

- 実装のシンプルさ
- 将来的な拡張のしやすさ
- ユニットテストのしやすさ

UI はモック画像のように、タイマー表示、状態表示、操作ボタン、当日の進捗表示を 1 画面に集約した構成を前提とする。

## 2. 全体方針

アーキテクチャは、Flask を薄いサーバー層として使い、タイマー進行や画面制御はブラウザ側で担当する構成とする。

- Flask は画面配信、設定取得、記録保存、統計返却を担当する
- ブラウザはタイマーのカウントダウン、状態遷移、円形プログレス描画、ボタン制御を担当する
- 永続化は SQLite を基本とし、作業セッションの完了イベントを保存する

リアルタイムな秒単位状態はサーバーで保持しない。サーバー側はタイマーそのものを動かすのではなく、完了したセッションの記録と集計を行う。

## 3. 推奨レイヤー構成

テスト性と責務分離を考慮し、以下の 4 層構成を採用する。

### 3.1 Presentation 層

ユーザーとの入出力を担当する。

- Flask のルーティング
- HTML テンプレート
- CSS
- フロントエンド JavaScript

この層には業務ロジックを極力置かない。

### 3.2 Application 層

ユースケース単位の処理を担当する。

- タイマー設定取得
- セッション完了記録
- 今日の統計取得

Flask ルートから呼ばれる窓口として機能する。

### 3.3 Domain 層

副作用を持たない純粋なビジネスロジックを担当する。

- タイマー残り時間計算
- 進捗率計算
- モード遷移判定
- 長休憩に入るタイミング判定
- 集計ロジック

この層を純粋関数中心にすることで、ユニットテストしやすくする。

### 3.4 Infrastructure 層

外部依存を担当する。

- SQLite アクセス
- 時刻取得
- 将来必要になれば設定ファイル読み込みなど

## 4. 推奨ディレクトリ構成

初期実装では以下の構成を推奨する。

```text
1.pomodoro/
  app.py
  templates/
    index.html
  static/
    css/
      style.css
    js/
      timer.js
      ui.js
      api.js
      state.js
  domain/
    timer_rules.py
    timer_calculator.py
    stats_calculator.py
  services/
    session_service.py
    stats_service.py
    settings_service.py
  infrastructure/
    repositories/
      session_repository.py
      sqlite_session_repository.py
    clock.py
  tests/
    domain/
    services/
    integration/
```

## 5. Flask 側の責務

Flask はアプリケーションの入口として使う。

### 5.1 app.py の役割

- Flask アプリ初期化
- ルーティング定義
- 必要なサービスの組み立て

app.py に直接 SQL や集計ロジックを書かない。可能な限り薄い構成にする。

### 5.2 想定 API

#### GET /

トップ画面を返す。

#### GET /api/settings

タイマー設定を返す。

レスポンス例:

```json
{
  "work_sec": 1500,
  "short_break_sec": 300,
  "long_break_sec": 900,
  "long_break_every": 4
}
```

#### GET /api/stats/today

今日の進捗情報を返す。

レスポンス例:

```json
{
  "completed_sessions": 4,
  "focus_minutes": 100
}
```

#### POST /api/sessions

完了したセッションを保存する。

リクエスト例:

```json
{
  "mode": "work",
  "duration_sec": 1500,
  "completed_at": "2026-05-07T10:30:00+09:00"
}
```

必要に応じて、設定変更 API や履歴取得 API を後から追加する。

## 6. フロントエンド側の責務

フロントエンドは 1 画面の状態管理を担当する。

### 6.1 モジュール分割

#### state.js

画面状態の管理と状態遷移を担当する。

- reducer もしくはそれに近い純粋関数
- START、PAUSE、RESET、TICK、COMPLETE などのイベント処理

#### timer.js

タイマー制御を担当する。

- 開始
- 一時停止
- 再開
- 完了判定
- 定期 tick の実行

#### ui.js

DOM 更新を担当する。

- 残り時間表示
- モード表示
- ボタン状態切り替え
- 円形プログレス描画
- 進捗カード更新

#### api.js

Flask API との通信を担当する。

- 設定取得
- 当日統計取得
- セッション記録送信

### 6.2 フロントエンド状態の例

```js
{
  mode: "work",
  isRunning: false,
  durationSec: 1500,
  remainingSec: 1500,
  startedAt: null,
  cycleCount: 0
}
```

## 7. タイマー実装方針

単純に 1 秒ごとに remainingSec を減算する方式ではなく、開始時刻から逆算する方式を採用する。

考え方は以下の通り。

```text
expectedEndAt = startedAt + durationSec
remainingSec = max(0, expectedEndAt - now)
```

この方式により、タブ非アクティブ時や一時的な処理遅延があっても大きくずれにくい。

## 8. 永続化方針

初期段階では SQLite を採用する。

### 8.1 保存対象

保存するのは完了したセッションのみとする。

例:

- work セッションの完了記録
- short_break セッションの完了記録
- long_break セッションの完了記録

ただし、進捗カードの主要指標は work セッション中心で集計する想定とする。

### 8.2 テーブル例

```text
sessions
- id
- mode
- duration_sec
- completed_at
```

今日の進捗はこのテーブルから集計する。派生値を別テーブルで二重管理しない。

## 9. テストしやすさを高めるための設計改善

アーキテクチャ上、以下を明示的に採用する。

### 9.1 時刻取得の抽象化

Python 側では現在時刻取得を直接呼ばず、Clock 抽象を経由する。

- 実装例: SystemClock
- テスト例: FakeClock

これにより、時間依存ロジックを固定時刻で安定してテストできる。

### 9.2 Repository パターンの採用

永続化は SessionRepository のような抽象を介して行う。

- 本番: SQLite 実装
- テスト: InMemory 実装

サービス層のテスト時に DB を起動しなくて済む。

### 9.3 Domain ロジックの純粋関数化

以下は副作用なしで実装する。

- 残り時間計算
- 進捗率計算
- 次モード判定
- 集計ロジック

この方針により、入力と出力だけでユニットテスト可能になる。

### 9.4 Flask ルートの薄型化

Flask ルートは以下に限定する。

- リクエスト受信
- 入力の簡易バリデーション
- サービス呼び出し
- レスポンス返却

ビジネスロジックを直接持たせないことで、ルートは統合テスト中心にできる。

### 9.5 フロントエンド状態遷移の純化

画面状態の変化は reducer もしくは純粋関数に寄せる。

これにより、DOM や setInterval に依存しないユニットテストを書ける。

## 10. 想定テスト戦略

### 10.1 Python 側ユニットテスト

主に Domain 層と Service 層を対象とする。

- 残り時間計算
- 進捗率計算
- モード遷移判定
- 長休憩判定
- 今日の統計集計
- セッション完了記録処理

### 10.2 Flask 統合テスト

API の入出力と HTTP ステータスを確認する。

- GET /api/settings の正常系
- GET /api/stats/today の正常系
- POST /api/sessions の正常系
- 不正入力時の 400 系レスポンス

### 10.3 フロントエンドテスト

必要に応じて次を対象にする。

- state.js の状態遷移テスト
- ui.js の描画テスト
- api.js の通信モックテスト

## 11. 避けるべき実装

以下はテスト性や保守性を下げるため避ける。

- Flask ルートに SQL を直接書く
- JavaScript の setInterval コールバックに業務ロジックを集中させる
- Date.now や datetime.now を各所で直接呼ぶ
- DOM 更新と状態遷移を同じ関数に詰め込む
- 今日の進捗を保存値と集計値で二重管理する

## 12. 実装順序の提案

以下の順で進めると安全に実装しやすい。

1. Flask でトップ画面を返す
2. HTML/CSS で UI モックを再現する
3. state.js と timer.js でタイマー状態管理を実装する
4. ui.js で円形プログレスと表示更新を実装する
5. API 経由で設定取得と進捗取得を接続する
6. セッション完了時に Flask へ保存する
7. Python 側と JavaScript 側のユニットテストを追加する

## 13. 最終的な設計要約

このアプリでは、Flask は配信と記録に集中し、タイマー進行はブラウザで処理する。

そのうえで、テスト性を高めるために次を必須方針とする。

- Domain ロジックを純粋関数化する
- 時刻取得を抽象化する
- 永続化を Repository 経由にする
- Flask ルートを薄くする
- フロントエンド状態遷移を UI から分離する

この構成により、初期実装はシンプルに保ちつつ、将来の機能追加やテスト拡充にも対応しやすいアーキテクチャになる。