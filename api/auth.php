<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
header('Content-Type: application/json');
require_once '../config/db.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '無効なリクエストです']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

// ログイン処理
if ($action === 'login') {
    $identifier = trim($data['email'] ?? ''); // email or nickname
    $password = $data['password'] ?? '';
    
    if (empty($identifier) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'メールアドレスとパスワードを入力してください']);
        exit;
    }
    
    // まずメールアドレスで検索
    $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->execute([$identifier]);
    $user = $stmt->fetch();

    // メールで見つからなければニックネームで検索
    if (!$user) {
        $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM users WHERE nickname = ?");
        $stmt->execute([$identifier]);
        $users_by_nick = $stmt->fetchAll();
        if (count($users_by_nick) === 1) {
            $user = $users_by_nick[0];
        } elseif (count($users_by_nick) > 1) {
            echo json_encode(['success' => false, 'message' => '同じニックネームのアカウントが複数存在します。メールアドレスでログインしてください']);
            exit;
        }
    }

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
        
        echo json_encode([
            'success' => true, 
            'message' => 'ログインしました',
            'redirect' => 'dashboard.php'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'メールアドレスまたはパスワードが正しくありません']);
    }
    exit;
}

// 新規登録処理
if ($action === 'register') {
    $name = trim($data['name'] ?? '');
    $nickname = trim($data['nickname'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $password_confirm = $data['password_confirm'] ?? '';
    
    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'すべての項目を入力してください']);
        exit;
    }
    
    if ($password !== $password_confirm) {
        echo json_encode(['success' => false, 'message' => 'パスワードが一致しません']);
        exit;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'パスワードは6文字以上にしてください']);
        exit;
    }
    
    // メールアドレス重複チェック
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'このメールアドレスは既に登録されています']);
        exit;
    }
    
    // ユーザー登録
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, nickname, email, password, role) VALUES (?, ?, ?, ?, 'user')");

    try {
        $stmt->execute([$name, $nickname, $email, $hashed_password]);
        echo json_encode(['success' => true, 'message' => '登録が完了しました。ログインしてください']);
    } catch (PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => '登録に失敗しました: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("Unexpected error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'エラーが発生しました: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => '無効なアクションです']);
?>
