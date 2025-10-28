# 🌍 インターネット公開・スマホアクセス対応ガイド

このシフト管理システムを**世界中どこからでもアクセス可能**にする方法です。

---

## 🚀 方法1: Railway (最もおすすめ・無料)

### 特徴
✅ 完全無料で始められる（月500時間まで）
✅ 自動SSL証明書（https対応）
✅ 自動デプロイ
✅ MySQLデータベース付き
✅ スマホ・タブレット・PC全て対応

### 手順

#### 1. GitHubにコードをアップロード

1. [GitHub](https://github.com/) でアカウント作成（無料）
2. 新しいリポジトリを作成（例: `shift-management`）
3. 以下のコマンドを実行:

```powershell
git remote add origin https://github.com/あなたのユーザー名/shift-management.git
git branch -M main
git push -u origin main
```

#### 2. Railwayにデプロイ

1. [Railway.app](https://railway.app/) にアクセス
2. "Start a New Project" をクリック
3. GitHubでログイン・連携
4. "Deploy from GitHub repo" を選択
5. 先ほど作成した `shift-management` リポジトリを選択
6. "Add variables" で環境変数を設定（後述）
7. "Deploy" をクリック

#### 3. MySQLデータベースを追加

1. プロジェクト画面で "+ New" → "Database" → "MySQL" を選択
2. 自動的にデータベースが作成されます
3. "Variables" タブで以下の環境変数を確認:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

#### 4. アプリケーションに環境変数を設定

アプリケーションのサービスを選択 → "Variables" タブで追加:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

#### 5. データベースを初期化

Railway の MySQL に接続して `config/setup.sql` を実行:

1. MySQL サービスの "Data" タブを開く
2. "Query" で SQL を実行するか、
3. ローカルの MySQL クライアントから接続して実行

#### 6. 完成！

デプロイが完了すると、以下のようなURLが発行されます:
```
https://shift-management-production.up.railway.app
```

このURLで**世界中どこからでも、スマホからでも**アクセス可能！

---

## 🚀 方法2: Heroku (無料枠あり)

### 特徴
✅ 有名で信頼性が高い
✅ 無料枠あり（制限あり）
✅ PostgreSQL/MySQL対応

### 手順

1. [Heroku](https://www.heroku.com/) でアカウント作成
2. Heroku CLI をインストール
3. 以下のコマンドを実行:

```powershell
heroku login
heroku create shift-management-app
heroku addons:create cleardb:ignite  # MySQL追加
git push heroku main
heroku run php config/setup.sql  # DB初期化
heroku open
```

---

## 🚀 方法3: レンタルサーバー (有料・安定)

### おすすめサーバー

#### さくらインターネット（月131円〜）
- FTPでファイルアップロード
- phpMyAdminでDB作成
- 安定性が高い

#### ロリポップ（月99円〜）
- 初心者向け
- WordPressも動く
- コスパ良好

#### エックスサーバー（月990円〜）
- 高速・高性能
- 大規模向け

### 手順

1. レンタルサーバーを契約
2. FTPでファイルをアップロード
3. phpMyAdminで `config/setup.sql` を実行
4. 完成！

---

## 📱 スマホからアクセスする方法

### デプロイ後

1. 発行されたURL（例: `https://your-app.railway.app`）にアクセス
2. ブックマークに追加
3. ホーム画面に追加すればアプリのように使える！

### PWA対応（今後の拡張）

以下の機能を追加すると、さらにアプリっぽく使えます:
- オフライン対応
- プッシュ通知
- ホーム画面アイコン

---

## 🔄 データ同期について

### 自動同期
✅ クラウドにデプロイすれば、全ての端末で**リアルタイム同期**されます
- スマホで提出 → PCで即座に確認可能
- PCで作成 → スマホで即座に確認可能
- 複数人が同時にアクセス可能

### 仕組み
- すべてのデータはクラウドのMySQLに保存
- ブラウザからアクセスするたびに最新データを取得
- 別々のインターネット回線でもOK
- 別々のWi-FiでもOK
- 4G/5Gでも OK

---

## 💰 コスト比較

| サービス | 月額費用 | おすすめ度 |
|---------|---------|-----------|
| Railway | 無料〜 | ⭐⭐⭐⭐⭐ |
| Heroku | 無料〜 | ⭐⭐⭐⭐ |
| Render | 無料〜 | ⭐⭐⭐⭐ |
| さくらレンタルサーバー | 131円〜 | ⭐⭐⭐⭐ |
| ロリポップ | 99円〜 | ⭐⭐⭐ |
| VPS | 500円〜 | ⭐⭐⭐ |

---

## 🆘 トラブルシューティング

### デプロイエラー
- `config/db.php` が環境変数を読み取れているか確認
- データベース接続情報が正しいか確認

### 502 Bad Gateway
- データベースが起動しているか確認
- 環境変数が正しく設定されているか確認

### ログインできない
- `config/setup.sql` が実行されているか確認
- デフォルト管理者アカウントを試す

---

## 📞 サポート

問題が発生した場合は、以下を確認してください:
1. ブラウザの開発者ツール（F12）でエラーを確認
2. サーバーのログを確認
3. データベース接続を確認

---

## 🎉 完成後の使い方

1. **スマホのブラウザ**でURLを開く
2. **ブックマーク**に追加
3. **ホーム画面に追加**（Safariの共有ボタン → ホーム画面に追加）
4. アプリのように使える！

家でも外でも、どこからでもシフト管理ができます！
