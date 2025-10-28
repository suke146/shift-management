<?php
/**
 * データベースマイグレーションスクリプト
 * 週単位から半月単位への移行
 */

echo "=== データベースマイグレーション ===\n\n";

$db_file = __DIR__ . '/data/shift_management.db';

if (!file_exists($db_file)) {
    echo "データベースが存在しません。init_db.phpを実行してください。\n";
    exit(1);
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
    
    $pdo->exec('PRAGMA foreign_keys = OFF');
    
    echo "✓ 接続成功\n\n";
    
    // 現在のテーブル構造を確認
    echo "現在のテーブル構造を確認中...\n";
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        echo "テーブルが見つかりません。init_db.phpを実行してください。\n";
        exit(1);
    }
    
    echo "既存のテーブル: " . implode(', ', $tables) . "\n\n";
    
    // shift_submissionsテーブルの構造を確認
    $columns = $pdo->query("PRAGMA table_info(shift_submissions)")->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'name');
    
    // 既に新しいスキーマかチェック
    if (in_array('period_start', $columnNames) && in_array('shift_date', $columnNames)) {
        echo "✓ データベースは既に新しいスキーマです。マイグレーション不要。\n";
        $pdo->exec('PRAGMA foreign_keys = ON');
        exit(0);
    }
    
    // 古いスキーマの場合、マイグレーションを実行
    if (in_array('week_start', $columnNames) && in_array('day_of_week', $columnNames)) {
        echo "古いスキーマを検出しました。マイグレーションを開始します...\n\n";
        
        $pdo->beginTransaction();
        
        // バックアップテーブルを作成
        echo "1. バックアップを作成中...\n";
        $pdo->exec("DROP TABLE IF EXISTS shift_submissions_backup");
        $pdo->exec("CREATE TABLE shift_submissions_backup AS SELECT * FROM shift_submissions");
        $pdo->exec("DROP TABLE IF EXISTS final_shifts_backup");
        $pdo->exec("CREATE TABLE final_shifts_backup AS SELECT * FROM final_shifts");
        echo "✓ バックアップ完成\n\n";
        
        // 古いテーブルを削除
        echo "2. 古いテーブルを削除中...\n";
        $pdo->exec("DROP TABLE IF EXISTS shift_submissions");
        $pdo->exec("DROP TABLE IF EXISTS final_shifts");
        echo "✓ 削除完了\n\n";
        
        // 新しいスキーマでテーブルを作成
        echo "3. 新しいテーブルを作成中...\n";
        
        // shift_submissionsテーブル
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS shift_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                period_start DATE NOT NULL,
                shift_date DATE NOT NULL,
                start_time TIME NULL,
                end_time TIME NULL,
                is_available BOOLEAN DEFAULT 1,
                status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, period_start, shift_date)
            )
        ");
        
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_user_period ON shift_submissions(user_id, period_start)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_period ON shift_submissions(period_start)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_shift_date ON shift_submissions(shift_date)");
        
        // final_shiftsテーブル
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS final_shifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                shift_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id),
                UNIQUE(user_id, shift_date)
            )
        ");
        
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_user_date ON final_shifts(user_id, shift_date)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_date ON final_shifts(shift_date)");
        
        echo "✓ 新しいテーブル作成完了\n\n";
        
        // final_shiftsのデータは移行可能
        echo "4. final_shiftsデータを移行中...\n";
        $finalShifts = $pdo->query("SELECT * FROM final_shifts_backup")->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($finalShifts)) {
            $stmt = $pdo->prepare("
                INSERT INTO final_shifts (id, user_id, shift_date, start_time, end_time, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($finalShifts as $shift) {
                $stmt->execute([
                    $shift['id'],
                    $shift['user_id'],
                    $shift['shift_date'],
                    $shift['start_time'],
                    $shift['end_time'],
                    $shift['created_by'],
                    $shift['created_at'],
                    $shift['updated_at']
                ]);
            }
            echo "✓ " . count($finalShifts) . "件のfinal_shiftsを移行しました\n\n";
        } else {
            echo "✓ 移行するfinal_shiftsデータはありません\n\n";
        }
        
        // shift_submissionsは新しい形式で再提出が必要
        echo "5. shift_submissionsについて\n";
        echo "⚠ shift_submissionsは構造が大きく変わったため、自動移行できません。\n";
        echo "⚠ ユーザーに再度シフトを提出してもらう必要があります。\n\n";
        
        // バックアップテーブルを削除
        echo "6. バックアップテーブルを削除中...\n";
        $pdo->exec("DROP TABLE IF EXISTS shift_submissions_backup");
        $pdo->exec("DROP TABLE IF EXISTS final_shifts_backup");
        echo "✓ 削除完了\n\n";
        
        $pdo->commit();
        
        echo "=== マイグレーション完了 ===\n";
        echo "✓ データベースが新しいスキーマに更新されました\n";
        echo "✓ final_shiftsは保持されました\n";
        echo "⚠ shift_submissionsは再提出が必要です\n";
        
    } else {
        echo "⚠ 不明なスキーマ構造です。手動で確認してください。\n";
        print_r($columnNames);
    }
    
    $pdo->exec('PRAGMA foreign_keys = ON');
    
} catch (PDOException $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    echo "\n✗ エラー: " . $e->getMessage() . "\n";
    exit(1);
}
?>
