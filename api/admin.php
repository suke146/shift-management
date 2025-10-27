<?php
header('Content-Type: application/json');
require_once '../config/db.php';

session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => '管理者権限が必要です']);
    exit;
}

$admin_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

// 全ユーザー取得
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_users') {
    $stmt = $pdo->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'users' => $users]);
    exit;
}

// ユーザーロール変更
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_role') {
    $data = json_decode(file_get_contents('php://input'), true);
    $target_user_id = $data['user_id'] ?? 0;
    $new_role = $data['role'] ?? '';
    
    if (!in_array($new_role, ['user', 'admin'])) {
        echo json_encode(['success' => false, 'message' => '無効なロールです']);
        exit;
    }
    
    if ($target_user_id == $admin_id) {
        echo json_encode(['success' => false, 'message' => '自分自身のロールは変更できません']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
    $stmt->execute([$new_role, $target_user_id]);
    
    echo json_encode(['success' => true, 'message' => 'ロールを更新しました']);
    exit;
}

// ユーザー削除
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete_user') {
    $data = json_decode(file_get_contents('php://input'), true);
    $target_user_id = $data['user_id'] ?? 0;
    
    if ($target_user_id == $admin_id) {
        echo json_encode(['success' => false, 'message' => '自分自身は削除できません']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$target_user_id]);
    
    echo json_encode(['success' => true, 'message' => 'ユーザーを削除しました']);
    exit;
}

// 全ユーザーのシフト提出を取得
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_all_submissions') {
    $week_start = $_GET['week_start'] ?? '';
    
    if (empty($week_start)) {
        echo json_encode(['success' => false, 'message' => '週を指定してください']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT ss.*, u.name as user_name
        FROM shift_submissions ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.week_start = ?
        ORDER BY u.name, ss.day_of_week
    ");
    $stmt->execute([$week_start]);
    $submissions = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'submissions' => $submissions]);
    exit;
}

// 確定シフト作成
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create_final_shifts') {
    $data = json_decode(file_get_contents('php://input'), true);
    $shifts = $data['shifts'] ?? [];
    
    if (empty($shifts)) {
        echo json_encode(['success' => false, 'message' => 'シフトデータがありません']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("
            INSERT INTO final_shifts (user_id, shift_date, start_time, end_time, created_by) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)
        ");
        
        foreach ($shifts as $shift) {
            $stmt->execute([
                $shift['user_id'],
                $shift['shift_date'],
                $shift['start_time'],
                $shift['end_time'],
                $admin_id
            ]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => '確定シフトを作成しました']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'シフト作成に失敗しました: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => '無効なリクエストです']);
?>
