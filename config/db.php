<?php
// SQLiteデータベース設定
$db_file = __DIR__ . '/../data/shift_management.db';

// データディレクトリがなければ作成
$data_dir = dirname($db_file);
if (!is_dir($data_dir)) {
    mkdir($data_dir, 0755, true);
}

try {
    $pdo = new PDO(
        "sqlite:$db_file",
        null,
        null,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // 外部キー制約を有効化
    $pdo->exec('PRAGMA foreign_keys = ON');
    
} catch (PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'データベース接続エラー: ' . $e->getMessage()]));
}
?>
