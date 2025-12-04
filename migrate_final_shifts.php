<?php
require_once 'config/db.php';

try {
    echo "final_shiftsテーブルを再作成します...\n";
    
    $pdo->beginTransaction();
    
    // 既存データをバックアップ
    $backup = $pdo->query("SELECT * FROM final_shifts")->fetchAll();
    echo "既存データ " . count($backup) . " 件をバックアップしました\n";
    
    // テーブルを削除
    $pdo->exec("DROP TABLE IF EXISTS final_shifts");
    echo "旧テーブルを削除しました\n";
    
    // 新しいテーブルを作成（NULL許可）
    $pdo->exec("
        CREATE TABLE final_shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            shift_date DATE NOT NULL,
            start_time TIME NULL,
            end_time TIME NULL,
            is_day_off INTEGER DEFAULT 0,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id),
            UNIQUE(user_id, shift_date)
        )
    ");
    echo "新しいテーブルを作成しました\n";
    
    // インデックスを再作成
    $pdo->exec("CREATE INDEX idx_user_date ON final_shifts(user_id, shift_date)");
    $pdo->exec("CREATE INDEX idx_date ON final_shifts(shift_date)");
    echo "インデックスを作成しました\n";
    
    // データを復元
    if (count($backup) > 0) {
        $stmt = $pdo->prepare("
            INSERT INTO final_shifts (id, user_id, shift_date, start_time, end_time, is_day_off, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($backup as $row) {
            $is_day_off = isset($row['is_day_off']) ? $row['is_day_off'] : 0;
            $stmt->execute([
                $row['id'],
                $row['user_id'],
                $row['shift_date'],
                $row['start_time'],
                $row['end_time'],
                $is_day_off,
                $row['created_by'],
                $row['created_at'],
                $row['updated_at']
            ]);
        }
        echo "データを復元しました\n";
    }
    
    $pdo->commit();
    echo "\n✓ マイグレーション完了！\n";
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "エラー: " . $e->getMessage() . "\n";
    exit(1);
}
?>
