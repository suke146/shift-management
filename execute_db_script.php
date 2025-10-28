<?php
/**
 * データベーススクリプト実行用APIエンドポイント
 */

header('Content-Type: text/plain; charset=utf-8');

$script = $_GET['script'] ?? '';

$allowed_scripts = [
    'init' => 'init_db.php',
    'migrate' => 'migrate_db.php',
    'reset' => 'reset_db.php'
];

if (!isset($allowed_scripts[$script])) {
    echo "エラー: 無効なスクリプトが指定されました\n";
    exit(1);
}

$script_file = __DIR__ . '/' . $allowed_scripts[$script];

if (!file_exists($script_file)) {
    echo "エラー: スクリプトファイルが見つかりません: {$script_file}\n";
    exit(1);
}

echo "=== {$allowed_scripts[$script]} を実行します ===\n\n";

// バッファリングを無効化してリアルタイム出力
ob_implicit_flush(true);
ob_end_flush();

// スクリプトを実行
try {
    include $script_file;
} catch (Exception $e) {
    echo "\n\nエラー: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n\n=== 実行完了 ===\n";
?>
