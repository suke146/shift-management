FROM php:8.3-cli

# 必要なシステムパッケージをインストール
RUN apt-get update && apt-get install -y \
    libsqlite3-dev \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# PHP拡張機能をインストール (SQLite)
RUN docker-php-ext-install pdo pdo_sqlite

# 作業ディレクトリを設定
WORKDIR /var/www/html

# アプリケーションファイルをコピー
COPY . .

# データディレクトリを作成
RUN mkdir -p /var/www/html/data && chmod 777 /var/www/html/data

# ポートを環境変数から取得（Railwayが自動設定）
ENV PORT=8000

# ヘルスチェック用のファイル
RUN echo "<?php echo 'OK';" > /var/www/html/health.php

# スタートアップスクリプトを実行（PHPベース）
CMD ["php", "/var/www/html/startup.php"]
