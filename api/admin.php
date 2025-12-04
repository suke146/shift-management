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

// 全ユーザーのシフト提出を取得（半月ごと）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_all_submissions') {
    $period_start = $_GET['period_start'] ?? '';
    
    if (empty($period_start)) {
        echo json_encode(['success' => false, 'message' => '期間を指定してください']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT ss.*, u.name as user_name
        FROM shift_submissions ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.period_start = ?
        ORDER BY u.name, ss.shift_date
    ");
    $stmt->execute([$period_start]);
    $submissions = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'submissions' => $submissions]);
    exit;
}

// シフト提出のステータス更新（承認/却下）
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_submission_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    $target_user_id = $data['user_id'] ?? 0;
    $shift_date = $data['shift_date'] ?? '';
    $period_start = $data['period_start'] ?? '';
    $new_status = $data['status'] ?? '';

    if (!in_array($new_status, ['approved', 'rejected', 'pending'])) {
        echo json_encode(['success' => false, 'message' => '無効なステータスです']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE shift_submissions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND period_start = ? AND shift_date = ?");
    $stmt->execute([$new_status, $target_user_id, $period_start, $shift_date]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'ステータスを更新しました']);
    } else {
        echo json_encode(['success' => false, 'message' => '該当の提出が見つかりませんでした']);
    }
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
        
        // SQLiteではUPSERT構文を使用
        $stmt = $pdo->prepare("
            INSERT INTO final_shifts (user_id, shift_date, start_time, end_time, is_day_off, created_by) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, shift_date) 
            DO UPDATE SET start_time = excluded.start_time, end_time = excluded.end_time, is_day_off = excluded.is_day_off, updated_at = CURRENT_TIMESTAMP
        ");
        
        foreach ($shifts as $shift) {
            $is_day_off = isset($shift['is_day_off']) && $shift['is_day_off'] ? 1 : 0;
            $start_time = $is_day_off ? null : ($shift['start_time'] ?? null);
            $end_time = $is_day_off ? null : ($shift['end_time'] ?? null);
            
            $stmt->execute([
                $shift['user_id'],
                $shift['shift_date'],
                $start_time,
                $end_time,
                $is_day_off,
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

// 確定シフト取得（期間指定）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_final_shifts') {
    $period_start = $_GET['period_start'] ?? '';
    
    if (empty($period_start)) {
        echo json_encode(['success' => false, 'message' => '期間を指定してください']);
        exit;
    }
    
    // 期間の終了日を計算
    $start_date = new DateTime($period_start);
    $day = (int)$start_date->format('d');
    if ($day === 1) {
        $end_date = clone $start_date;
        $end_date->setDate((int)$end_date->format('Y'), (int)$end_date->format('m'), 15);
    } else {
        $end_date = clone $start_date;
        $end_date->modify('last day of this month');
    }
    
    $stmt = $pdo->prepare("
        SELECT fs.*, u.name as user_name
        FROM final_shifts fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.shift_date >= ? AND fs.shift_date <= ?
        ORDER BY fs.shift_date, u.name
    ");
    $stmt->execute([$period_start, $end_date->format('Y-m-d')]);
    $shifts = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'shifts' => $shifts]);
    exit;
}

// 確定シフト削除
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete_final_shift') {
    $data = json_decode(file_get_contents('php://input'), true);
    $shift_id = $data['shift_id'] ?? 0;
    
    $stmt = $pdo->prepare("DELETE FROM final_shifts WHERE id = ?");
    $stmt->execute([$shift_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'シフトを削除しました']);
    } else {
        echo json_encode(['success' => false, 'message' => 'シフトが見つかりませんでした']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => '無効なリクエストです']);
?>
