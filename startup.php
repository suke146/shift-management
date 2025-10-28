<?php
/**
 * Railway起動スクリプト - データベース自動初期化
 */

echo "=== Shift Management System Startup ===\n\n";

$db_file = __DIR__ . '/data/shift_management.db';
$data_dir = dirname($db_file);

// データディレクトリの確認
if (!is_dir($data_dir)) {
    echo "Creating data directory...\n";
    mkdir($data_dir, 0777, true);
    chmod($data_dir, 0777);
}

$needs_init = false;

// データベースファイルの確認
if (!file_exists($db_file)) {
    echo "Database file not found. Initialization required.\n";
    $needs_init = true;
} else {
    $db_size = filesize($db_file);
    echo "Database file exists. Size: {$db_size} bytes\n";
    
    if ($db_size === 0) {
        echo "Database is empty. Reinitialization required.\n";
        $needs_init = true;
    }
}

// データベース初期化が必要な場合
if ($needs_init) {
    echo "\n--- Running Database Initialization ---\n";
    require __DIR__ . '/init_db.php';
    echo "--- Database Initialization Complete ---\n\n";
} else {
    echo "Database is valid.\n\n";
}

// PHPサーバーを起動
$port = getenv('PORT') ?: 8000;
echo "Starting PHP built-in server on port {$port}...\n";
echo "Server is ready!\n\n";

$command = "php -S 0.0.0.0:{$port}";
echo "Executing: {$command}\n";

// サーバーを起動（この行以降は実行されない）
passthru($command);
?>
