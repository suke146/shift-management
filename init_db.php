<?php
/**
 * Railway MySQL データベース初期化スクリプト
 * MySQLクライアントがない環境でも、PHPから直接データベースを初期化できます
 */

echo "=== Railway MySQL データベース初期化 ===\n\n";

// Railway の環境変数から接続情報を取得
$host = getenv('DB_HOST') ?: 'turntable.proxy.rlwy.net';
$port = getenv('DB_PORT') ?: '24203';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: 'vMHpPrkQHZpKWGZhZeamYPaBieaGMkow';
$database = getenv('DB_NAME') ?: 'railway';

echo "接続情報:\n";
echo "Host: $host\n";
echo "Port: $port\n";
echo "Database: $database\n\n";

try {
    echo "データベースに接続中...\n";
    $pdo = new PDO(
        "mysql:host=$host;port=$port;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
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
    
    foreach ($statements as $index => $statement) {
        try {
            // データベース作成文は特別処理
            if (stripos($statement, 'CREATE DATABASE') !== false) {
                $pdo->exec($statement);
                echo "✓ データベース作成\n";
                // データベースを選択
                $pdo->exec("USE $database");
                $successCount++;
                continue;
            }
            
            if (stripos($statement, 'USE ') !== false) {
                $pdo->exec($statement);
                echo "✓ データベース選択\n";
                $successCount++;
                continue;
            }
            
            $pdo->exec($statement);
            
            // どのテーブルを作成したかを表示
            if (stripos($statement, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE[^`]*`?(\w+)`?/i', $statement, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ テーブル作成: $tableName\n";
            } elseif (stripos($statement, 'INSERT INTO') !== false) {
                preg_match('/INSERT INTO[^`]*`?(\w+)`?/i', $statement, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ データ挿入: $tableName\n";
            }
            
            $successCount++;
            
        } catch (PDOException $e) {
            // 既に存在するエラーは無視
            if (strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'Duplicate entry') !== false) {
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
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
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
