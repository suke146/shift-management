<?php
require_once 'config/db.php';

try {
    // is_day_off列を追加
    $pdo->exec("ALTER TABLE final_shifts ADD COLUMN is_day_off INTEGER DEFAULT 0");
    echo "✓ is_day_off列を追加しました\n";
    
    // start_timeとend_timeをNULL許可に変更（SQLiteでは制約変更が難しいため、既存データは維持）
    echo "✓ start_timeとend_timeは既存のまま（NULL許可として扱います）\n";
    
    echo "\n✓ マイグレーション完了\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'duplicate column name') !== false) {
        echo "✓ is_day_off列は既に存在します\n";
    } else {
        echo "エラー: " . $e->getMessage() . "\n";
    }
}
?>
