# Railway デプロイ用設定

## 手順

1. [Railway.app](https://railway.app/) にアクセスしてGitHubでサインアップ
2. "New Project" → "Deploy from GitHub repo" を選択
3. このプロジェクトを選択
4. MySQL データベースを追加
5. 環境変数を設定

## 必要な環境変数

Railway のプロジェクト設定で以下を追加:

Railway デプロイ手順

概要
- このリポジトリは PHP（plain）アプリです。デフォルトでは SQLite を使いますが、Railway の Postgres を使うよう設定できます。

準備
1. GitHub にリポジトリを push しておく（Railway と連携するため）。

Railway 側の作業
1. Railway にログインして New Project → Deploy From GitHub を選択。
2. リポジトリを選択してデプロイを開始。
3. Environment Variables を追加:
	- DATABASE_URL: Railway の Postgres の接続 URL（例: postgres://user:pass@host:5432/dbname）。
	- PORT: 省略可（Railway が自動で割り当てます）。
4. Build/Start Command:
	- Start Command または Procfile を使う場合、Procfile に `web: php -S 0.0.0.0:${PORT:-8000}` を追加済みなので通常は不要。

マイグレーション
- Postgres に接続したら、以下のいずれかでテーブルを作成してください:
  1. Railway のコンソールで `psql` を使って `config/setup.sql` を実行する。
  2. or アプリ起動後に別途マイグレーションスクリプトを用意して実行する。

注意点
- SQLite から Postgres へ移行する際、`config/setup.sql` は SQLite 構文で書かれています。Postgres の互換性に注意してください（型の違いなど）。必要なら私が Postgres 用 SQL を作ります。
- 環境変数 `DATABASE_URL` が設定されるとアプリは Postgres に接続します。そうでなければローカルの SQLite を使います。

推奨フロー
1. GitHub に push
2. Railway でプロジェクト作成 + Postgres インスタンス作成
3. 環境変数 `DATABASE_URL` を設定
4. デプロイ後、Railway のコンソールで `config/setup.sql` を Postgres 用に実行（必要なら私が SQL を調整します）

必要なら私が以下を代行します（あなたの許可要）:
- `config/setup.sql` を Postgres 用に変換する
- デプロイ用の Dockerfile を追加して自動デプロイを安定化する
- マイグレーションを自動で実行するスクリプトを追加する

問題が出たら Railway のログを貼ってください。
