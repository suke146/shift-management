<?php
/**
 * データベースリセットスクリプト（開発用）
 * 既存のテーブルを削除して再作成します
 */

echo "=== データベースリセット ===\n\n";

$db_file = __DIR__ . '/data/shift_management.db';

if (!file_exists($db_file)) {
    die("エラー: データベースファイルが見つかりません\n");
}

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
    
    // 外部キー制約を一時的に無効化
    $pdo->exec('PRAGMA foreign_keys = OFF');
    
    echo "✓ 接続成功\n\n";

    // 既存のテーブルを削除
    $tables = ['final_shifts', 'shift_submissions', 'users'];
    
    echo "テーブルを削除中...\n";
    foreach ($tables as $table) {
        try {
            $pdo->exec("DROP TABLE IF EXISTS $table");
            echo "✓ 削除: $table\n";
        } catch (PDOException $e) {
            echo "⚠ スキップ: $table ({$e->getMessage()})\n";
        }
    }
    
    echo "\nインデックスを削除中...\n";
    $indexes = [
        'idx_email', 'idx_role', 
        'idx_user_period', 'idx_period', 'idx_shift_date',
        'idx_user_date', 'idx_date'
    ];
    
    foreach ($indexes as $index) {
        try {
            $pdo->exec("DROP INDEX IF EXISTS $index");
            echo "✓ 削除: $index\n";
        } catch (PDOException $e) {
            // インデックスが存在しない場合はスキップ
        }
    }
    
    // 外部キー制約を再有効化
    $pdo->exec('PRAGMA foreign_keys = ON');
    
    echo "\n✓ テーブルとインデックスの削除が完了しました\n\n";
    echo "次のコマンドでテーブルを再作成してください:\n";
    echo "  php init_db.php\n";
    
} catch (PDOException $e) {
    echo "\n✗ エラー: " . $e->getMessage() . "\n";
    exit(1);
}
?>
