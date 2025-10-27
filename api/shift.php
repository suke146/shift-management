<?php
header('Content-Type: application/json');
require_once '../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'ログインしてください']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

// シフト提出
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'submit') {
    $data = json_decode(file_get_contents('php://input'), true);
    $week_start = $data['week_start'] ?? '';
    $shifts = $data['shifts'] ?? [];
    
    if (empty($week_start) || empty($shifts)) {
        echo json_encode(['success' => false, 'message' => '必須項目を入力してください']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        // 既存のシフト提出を削除
        $stmt = $pdo->prepare("DELETE FROM shift_submissions WHERE user_id = ? AND week_start = ?");
        $stmt->execute([$user_id, $week_start]);
        
        // 新しいシフトを登録
        $stmt = $pdo->prepare("
            INSERT INTO shift_submissions (user_id, week_start, day_of_week, start_time, end_time, is_available) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($shifts as $shift) {
            $stmt->execute([
                $user_id,
                $week_start,
                $shift['day_of_week'],
                $shift['start_time'] ?? null,
                $shift['end_time'] ?? null,
                $shift['is_available'] ? 1 : 0
            ]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'シフトを提出しました']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'シフト提出に失敗しました: ' . $e->getMessage()]);
    }
    exit;
}

// シフト取得(自分の提出したシフト)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_my_submissions') {
    $week_start = $_GET['week_start'] ?? '';
    
    if (empty($week_start)) {
        echo json_encode(['success' => false, 'message' => '週を指定してください']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT day_of_week, start_time, end_time, is_available, status 
        FROM shift_submissions 
        WHERE user_id = ? AND week_start = ?
        ORDER BY day_of_week
    ");
    $stmt->execute([$user_id, $week_start]);
    $shifts = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'shifts' => $shifts]);
    exit;
}

// 確定シフト閲覧
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_final_shifts') {
    $week_start = $_GET['week_start'] ?? '';
    
    if (empty($week_start)) {
        echo json_encode(['success' => false, 'message' => '週を指定してください']);
        exit;
    }
    
    // 週の最終日を計算
    $week_end = date('Y-m-d', strtotime($week_start . ' +6 days'));
    
    $stmt = $pdo->prepare("
        SELECT fs.*, u.name as user_name
        FROM final_shifts fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.shift_date BETWEEN ? AND ?
        ORDER BY fs.shift_date, fs.start_time
    ");
    $stmt->execute([$week_start, $week_end]);
    $shifts = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'shifts' => $shifts]);
    exit;
}

echo json_encode(['success' => false, 'message' => '無効なリクエストです']);
?>
