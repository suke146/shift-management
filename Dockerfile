FROM php:8.3-cli

# 必要なシステムパッケージをインストール
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# PHP拡張機能をインストール
RUN docker-php-ext-install pdo pdo_mysql mysqli

# 作業ディレクトリを設定
WORKDIR /var/www/html

# アプリケーションファイルをコピー
COPY . .

# ポートを環境変数から取得（Railwayが自動設定）
ENV PORT=8000

# ヘルスチェック用のファイル
RUN echo "<?php echo 'OK';" > /var/www/html/health.php

# PHPビルトインサーバーを起動（ルーターファイルなし）
CMD php -S 0.0.0.0:${PORT}
