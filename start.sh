#!/bin/sh
# Startup script for Railway deployment

echo "=== Starting Shift Management System ==="

# データベースの存在確認
if [ ! -f /var/www/html/data/shift_management.db ]; then
    echo "Database not found. Initializing..."
    php /var/www/html/init_db.php
    echo "Database initialization complete."
else
    echo "Database exists. Checking size..."
    DB_SIZE=$(stat -f%z /var/www/html/data/shift_management.db 2>/dev/null || stat -c%s /var/www/html/data/shift_management.db)
    echo "Database size: $DB_SIZE bytes"
    
    if [ "$DB_SIZE" -eq 0 ]; then
        echo "Database is empty. Reinitializing..."
        php /var/www/html/init_db.php
        echo "Database reinitialization complete."
    else
        echo "Database is valid."
    fi
fi

# PHPサーバーを起動
echo "Starting PHP server on port ${PORT:-8000}..."
exec php -S 0.0.0.0:${PORT:-8000}
