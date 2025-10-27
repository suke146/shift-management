# Railway デプロイ用設定

## 手順

1. [Railway.app](https://railway.app/) にアクセスしてGitHubでサインアップ
2. "New Project" → "Deploy from GitHub repo" を選択
3. このプロジェクトを選択
4. MySQL データベースを追加
5. 環境変数を設定

## 必要な環境変数

Railway のプロジェクト設定で以下を追加:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

## デプロイ後

自動的に `https://your-app.railway.app` のようなURLが発行されます。
このURLで世界中どこからでもアクセス可能になります。
