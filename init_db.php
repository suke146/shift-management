<?php
/**
 * SQLite データベース初期化スクリプト
 */

echo "=== SQLite データベース初期化 ===\n\n";

// データベースファイルのパス
$db_file = __DIR__ . '/data/shift_management.db';
$data_dir = dirname($db_file);

// データディレクトリを作成
if (!is_dir($data_dir)) {
    mkdir($data_dir, 0755, true);
    echo "✓ データディレクトリ作成: $data_dir\n";
}

echo "データベースファイル: $db_file\n\n";

try {
    echo "データベースに接続中...\n";
    $pdo = new PDO(
        "sqlite:$db_file",
        null,
        null,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // 外部キー制約を有効化
    $pdo->exec('PRAGMA foreign_keys = ON');
    
    echo "✓ 接続成功\n\n";

    // setup.sql ファイルを読み込み
    $sqlFile = __DIR__ . '/config/setup.sql';
    
    if (!file_exists($sqlFile)) {
        die("エラー: config/setup.sql が見つかりません\n");
    }
    
    echo "SQLファイルを読み込み中...\n";
    $sql = file_get_contents($sqlFile);
    
    // コメントを削除
    $sql = preg_replace('/--.*$/m', '', $sql);
    
    // 複数のSQL文に分割
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt);
        }
    );
    
    echo "SQLステートメント数: " . count($statements) . "\n\n";
    echo "実行中...\n";
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        try {
            $pdo->exec($statement);
            
            // どのテーブルを作成したかを表示
            if (stripos($statement, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE[^"]*"?(\w+)"?/i', $statement, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ テーブル作成: $tableName\n";
            } elseif (stripos($statement, 'INSERT') !== false) {
                preg_match('/INSERT[^"]*INTO[^"]*"?(\w+)"?/i', $statement, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ データ挿入: $tableName\n";
            } elseif (stripos($statement, 'CREATE INDEX') !== false) {
                preg_match('/CREATE INDEX[^"]*"?(\w+)"?/i', $statement, $matches);
                $indexName = $matches[1] ?? 'unknown';
                echo "✓ インデックス作成: $indexName\n";
            }
            
            $successCount++;
            
        } catch (PDOException $e) {
            // 既に存在するエラーは無視
            if (strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'UNIQUE constraint failed') !== false) {
                echo "⚠ スキップ: 既に存在します\n";
            } else {
                echo "✗ エラー: " . $e->getMessage() . "\n";
                $errorCount++;
            }
        }
    }
    
    echo "\n=== 完了 ===\n";
    echo "成功: $successCount 件\n";
    echo "エラー: $errorCount 件\n\n";
    
    // テーブル一覧を表示
    echo "作成されたテーブル:\n";
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "  - $table\n";
    }
    
    echo "\n✓ データベースの初期化が完了しました！\n";
    echo "\nデフォルト管理者アカウント:\n";
    echo "  メール: admin@example.com\n";
    echo "  パスワード: admin123\n";
    
} catch (PDOException $e) {
    echo "\n✗ エラー: " . $e->getMessage() . "\n";
    exit(1);
}
?>
