FROM php:8.2-cli

# MySQL PDO拡張をインストール
RUN docker-php-ext-install pdo pdo_mysql mysqli

# 作業ディレクトリ
WORKDIR /app

# アプリケーションファイルをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# PHPビルトインサーバーを起動
CMD ["php", "-S", "0.0.0.0:8000"]
