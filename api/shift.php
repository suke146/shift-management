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

// シフト提出（半月ごと）
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'submit') {
    $data = json_decode(file_get_contents('php://input'), true);
    $period_start = $data['period_start'] ?? '';
    $shifts = $data['shifts'] ?? [];
    $note = $data['note'] ?? '';
    if (empty($period_start) || empty($shifts)) {
        echo json_encode(['success' => false, 'message' => '必須項目を入力してください']);
        exit;
    }
    try {
        $pdo->beginTransaction();
        // 既存のシフト提出を削除
        $stmt = $pdo->prepare("DELETE FROM shift_submissions WHERE user_id = ? AND period_start = ?");
        $stmt->execute([$user_id, $period_start]);
        // 新しいシフトを登録
        // noteカラムがある場合
        $hasNote = false;
        $colCheck = $pdo->query("PRAGMA table_info(shift_submissions)")->fetchAll();
        foreach ($colCheck as $col) {
            if ($col['name'] === 'note') $hasNote = true;
        }
        if ($hasNote) {
            $stmt = $pdo->prepare("
                INSERT INTO shift_submissions (user_id, period_start, shift_date, start_time, end_time, is_available, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($shifts as $shift) {
                $stmt->execute([
                    $user_id,
                    $period_start,
                    $shift['shift_date'],
                    $shift['start_time'] ?? null,
                    $shift['end_time'] ?? null,
                    $shift['is_available'] ? 1 : 0,
                    $shift['note'] ?? ''
                ]);
            }
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO shift_submissions (user_id, period_start, shift_date, start_time, end_time, is_available) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($shifts as $shift) {
                $stmt->execute([
                    $user_id,
                    $period_start,
                    $shift['shift_date'],
                    $shift['start_time'] ?? null,
                    $shift['end_time'] ?? null,
                    $shift['is_available'] ? 1 : 0
                ]);
            }
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
    $period_start = $_GET['period_start'] ?? '';
    if (empty($period_start)) {
        echo json_encode(['success' => false, 'message' => '期間を指定してください']);
        exit;
    }
    // noteカラムがあるかチェック
    $hasNote = false;
    $colCheck = $pdo->query("PRAGMA table_info(shift_submissions)")->fetchAll();
    foreach ($colCheck as $col) {
        if ($col['name'] === 'note') $hasNote = true;
    }
    if ($hasNote) {
        $stmt = $pdo->prepare("
            SELECT shift_date, start_time, end_time, is_available, status, note 
            FROM shift_submissions 
            WHERE user_id = ? AND period_start = ?
            ORDER BY shift_date
        ");
        $stmt->execute([$user_id, $period_start]);
        $shifts = $stmt->fetchAll();
        echo json_encode(['success' => true, 'shifts' => $shifts]);
    } else {
        $stmt = $pdo->prepare("
            SELECT shift_date, start_time, end_time, is_available, status 
            FROM shift_submissions 
            WHERE user_id = ? AND period_start = ?
            ORDER BY shift_date
        ");
        $stmt->execute([$user_id, $period_start]);
        $shifts = $stmt->fetchAll();
        echo json_encode(['success' => true, 'shifts' => $shifts]);
    }
    exit;
}

// 確定シフト閲覧（半月ごと）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_final_shifts') {
    $period_start = $_GET['period_start'] ?? '';
    
    if (empty($period_start)) {
        echo json_encode(['success' => false, 'message' => '期間を指定してください']);
        exit;
    }
    
    // 半月の最終日を計算（1日開始なら15日まで、16日開始なら月末まで）
    $start_day = intval(date('d', strtotime($period_start)));
    if ($start_day === 1) {
        $period_end = date('Y-m-15', strtotime($period_start));
    } else {
        $period_end = date('Y-m-t', strtotime($period_start)); // 月末
    }
    
    $stmt = $pdo->prepare("
        SELECT fs.*, u.name as user_name
        FROM final_shifts fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.shift_date BETWEEN ? AND ?
        ORDER BY fs.shift_date, fs.start_time
    ");
    $stmt->execute([$period_start, $period_end]);
    $shifts = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'shifts' => $shifts]);
    exit;
}

// 全員の希望シフト閲覧（半月ごと）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_all_requests') {
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

// 確定シフト閲覧（日付指定）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_final_shifts_by_date') {
    $date = $_GET['date'] ?? '';
    
    if (empty($date)) {
        echo json_encode(['success' => false, 'message' => '日付を指定してください']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT fs.*, u.name as user_name
        FROM final_shifts fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.shift_date = ?
        ORDER BY fs.start_time
    ");
    $stmt->execute([$date]);
    $shifts = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'shifts' => $shifts]);
    exit;
}

// 確定シフト閲覧（期間指定）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_final_shifts_range') {
    $start_date = $_GET['start_date'] ?? '';
    $end_date = $_GET['end_date'] ?? '';
    
    if (empty($start_date) || empty($end_date)) {
        echo json_encode(['success' => false, 'message' => '期間を指定してください']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT fs.*, u.name as user_name
        FROM final_shifts fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.shift_date BETWEEN ? AND ?
        ORDER BY fs.shift_date, fs.start_time
    ");
    $stmt->execute([$start_date, $end_date]);
    $shifts = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'shifts' => $shifts]);
    exit;
}

// 希望シフト閲覧（日付指定）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_requests_by_date') {
    $date = $_GET['date'] ?? '';
    
    if (empty($date)) {
        echo json_encode(['success' => false, 'message' => '日付を指定してください']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT ss.*, u.name as user_name
        FROM shift_submissions ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.shift_date = ?
        ORDER BY u.name
    ");
    $stmt->execute([$date]);
    $submissions = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'submissions' => $submissions]);
    exit;
}

// 希望シフト閲覧（期間指定）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_requests_range') {
    $start_date = $_GET['start_date'] ?? '';
    $end_date = $_GET['end_date'] ?? '';
    
    if (empty($start_date) || empty($end_date)) {
        echo json_encode(['success' => false, 'message' => '期間を指定してください']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT ss.*, u.name as user_name
        FROM shift_submissions ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.shift_date BETWEEN ? AND ?
        ORDER BY u.name, ss.shift_date
    ");
    $stmt->execute([$start_date, $end_date]);
    $submissions = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'submissions' => $submissions]);
    exit;
}

echo json_encode(['success' => false, 'message' => '無効なリクエストです']);
?>
