<?php
require_once 'config/db.php';

echo "=== API テスト ===\n\n";

// 1. ユーザー一覧取得
echo "1. ユーザー一覧取得テスト:\n";
try {
    $stmt = $pdo->query("SELECT id, name, email, role FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    echo "取得件数: " . count($users) . " 件\n";
    foreach ($users as $user) {
        echo "  - {$user['name']} ({$user['email']}) - {$user['role']}\n";
    }
} catch (PDOException $e) {
    echo "エラー: " . $e->getMessage() . "\n";
}

echo "\n2. シフト提出データ確認:\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM shift_submissions");
    $result = $stmt->fetch();
    echo "シフト提出件数: {$result['count']} 件\n";
    
    if ($result['count'] > 0) {
        $stmt = $pdo->query("SELECT ss.*, u.name as user_name FROM shift_submissions ss JOIN users u ON ss.user_id = u.id LIMIT 5");
        $submissions = $stmt->fetchAll();
        echo "最近の提出:\n";
        foreach ($submissions as $sub) {
            echo "  - {$sub['user_name']}: {$sub['shift_date']} ({$sub['start_time']} - {$sub['end_time']})\n";
        }
    }
} catch (PDOException $e) {
    echo "エラー: " . $e->getMessage() . "\n";
}

echo "\n3. 確定シフトデータ確認:\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM final_shifts");
    $result = $stmt->fetch();
    echo "確定シフト件数: {$result['count']} 件\n";
    
    if ($result['count'] > 0) {
        $stmt = $pdo->query("SELECT fs.*, u.name as user_name FROM final_shifts fs JOIN users u ON fs.user_id = u.id LIMIT 5");
        $shifts = $stmt->fetchAll();
        echo "最近の確定シフト:\n";
        foreach ($shifts as $shift) {
            echo "  - {$shift['user_name']}: {$shift['shift_date']} ({$shift['start_time']} - {$shift['end_time']})\n";
        }
    }
} catch (PDOException $e) {
    echo "エラー: " . $e->getMessage() . "\n";
}

echo "\n4. セッションテスト:\n";
session_start();
if (isset($_SESSION['user_id'])) {
    echo "セッションあり - User ID: {$_SESSION['user_id']}, Name: {$_SESSION['user_name']}, Role: {$_SESSION['user_role']}\n";
} else {
    echo "セッションなし（ログインしていません）\n";
}
?>
