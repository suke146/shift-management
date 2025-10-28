<?php
/**
 * データベース接続テストスクリプト
 */

header('Content-Type: application/json');

$result = [
    'status' => 'checking',
    'checks' => []
];

// 1. データベースファイルの存在確認
$db_file = __DIR__ . '/data/shift_management.db';
$result['checks']['db_file_path'] = $db_file;
$result['checks']['db_file_exists'] = file_exists($db_file);

if (!file_exists($db_file)) {
    $result['status'] = 'error';
    $result['message'] = 'データベースファイルが存在しません。init_db.php を実行してください。';
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

$result['checks']['db_file_size'] = filesize($db_file);
$result['checks']['db_file_writable'] = is_writable($db_file);

// 2. データベース接続テスト
try {
    require_once __DIR__ . '/config/db.php';
    $result['checks']['db_connection'] = 'success';
    
    // 3. テーブルの存在確認
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")->fetchAll(PDO::FETCH_COLUMN);
    $result['checks']['tables'] = $tables;
    
    // 4. usersテーブルの構造確認
    if (in_array('users', $tables)) {
        $columns = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_ASSOC);
        $result['checks']['users_columns'] = array_column($columns, 'name');
        
        // ユーザー数を確認
        $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $result['checks']['users_count'] = $userCount;
    } else {
        $result['checks']['users_table'] = 'not found';
    }
    
    // 5. shift_submissionsテーブルの構造確認
    if (in_array('shift_submissions', $tables)) {
        $columns = $pdo->query("PRAGMA table_info(shift_submissions)")->fetchAll(PDO::FETCH_ASSOC);
        $result['checks']['shift_submissions_columns'] = array_column($columns, 'name');
        
        // 新しいスキーマかチェック
        $columnNames = array_column($columns, 'name');
        if (in_array('period_start', $columnNames) && in_array('shift_date', $columnNames)) {
            $result['checks']['schema_version'] = 'new (half-monthly)';
        } elseif (in_array('week_start', $columnNames) && in_array('day_of_week', $columnNames)) {
            $result['checks']['schema_version'] = 'old (weekly) - MIGRATION NEEDED';
            $result['status'] = 'warning';
            $result['message'] = '古いスキーマです。migrate_db.php を実行してください。';
        } else {
            $result['checks']['schema_version'] = 'unknown';
        }
    } else {
        $result['checks']['shift_submissions_table'] = 'not found';
    }
    
    // 6. final_shiftsテーブルの構造確認
    if (in_array('final_shifts', $tables)) {
        $columns = $pdo->query("PRAGMA table_info(final_shifts)")->fetchAll(PDO::FETCH_ASSOC);
        $result['checks']['final_shifts_columns'] = array_column($columns, 'name');
        
        // UNIQUE制約の確認
        $indexes = $pdo->query("PRAGMA index_list(final_shifts)")->fetchAll(PDO::FETCH_ASSOC);
        $result['checks']['final_shifts_indexes'] = array_column($indexes, 'name');
    } else {
        $result['checks']['final_shifts_table'] = 'not found';
    }
    
    if ($result['status'] === 'checking') {
        $result['status'] = 'ok';
        $result['message'] = 'データベースは正常です';
    }
    
} catch (PDOException $e) {
    $result['status'] = 'error';
    $result['message'] = 'データベース接続エラー: ' . $e->getMessage();
    $result['checks']['db_connection'] = 'failed';
    $result['checks']['error_details'] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
