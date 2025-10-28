<?php
/**
 * ユーザーを管理者に昇格させるスクリプト
 */

header('Content-Type: text/plain; charset=utf-8');

echo "=== ユーザー管理ツール ===\n\n";

require_once __DIR__ . '/config/db.php';

// 全ユーザーを表示
echo "現在のユーザー一覧:\n";
echo str_repeat("-", 80) . "\n";
printf("%-5s %-20s %-30s %-10s\n", "ID", "名前", "メールアドレス", "権限");
echo str_repeat("-", 80) . "\n";

$users = $pdo->query("SELECT id, name, email, role FROM users ORDER BY id")->fetchAll();

if (empty($users)) {
    echo "ユーザーが登録されていません。\n";
    exit;
}

foreach ($users as $user) {
    $roleLabel = $user['role'] === 'admin' ? '管理者' : '一般';
    printf("%-5d %-20s %-30s %-10s\n", 
        $user['id'], 
        mb_substr($user['name'], 0, 20), 
        $user['email'], 
        $roleLabel
    );
}

echo str_repeat("-", 80) . "\n\n";

// クエリパラメータで操作を実行
$action = $_GET['action'] ?? '';
$user_id = $_GET['user_id'] ?? 0;

if ($action === 'promote' && $user_id > 0) {
    echo "ユーザーID {$user_id} を管理者に昇格させます...\n";
    
    $stmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
    $stmt->execute([$user_id]);
    
    if ($stmt->rowCount() > 0) {
        echo "✓ 成功: ユーザーID {$user_id} を管理者に昇格させました\n\n";
        
        // 更新後のユーザー情報を表示
        $user = $pdo->prepare("SELECT name, email, role FROM users WHERE id = ?");
        $user->execute([$user_id]);
        $userData = $user->fetch();
        
        if ($userData) {
            echo "更新後の情報:\n";
            echo "  名前: {$userData['name']}\n";
            echo "  メール: {$userData['email']}\n";
            echo "  権限: 管理者\n";
        }
    } else {
        echo "✗ エラー: ユーザーID {$user_id} が見つかりません\n";
    }
    
} elseif ($action === 'demote' && $user_id > 0) {
    echo "ユーザーID {$user_id} を一般ユーザーに降格させます...\n";
    
    $stmt = $pdo->prepare("UPDATE users SET role = 'user' WHERE id = ?");
    $stmt->execute([$user_id]);
    
    if ($stmt->rowCount() > 0) {
        echo "✓ 成功: ユーザーID {$user_id} を一般ユーザーに降格させました\n";
    } else {
        echo "✗ エラー: ユーザーID {$user_id} が見つかりません\n";
    }
    
} elseif ($action === 'create_admin') {
    echo "デフォルト管理者アカウントを作成します...\n";
    
    // admin@example.com が既に存在するかチェック
    $existing = $pdo->query("SELECT id FROM users WHERE email = 'admin@example.com'")->fetch();
    
    if ($existing) {
        echo "⚠ 既に admin@example.com が存在します (ID: {$existing['id']})\n";
        echo "このユーザーを管理者に昇格させますか？\n";
        echo "実行するには: ?action=promote&user_id={$existing['id']}\n";
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, password, role) 
            VALUES ('管理者', 'admin@example.com', ?, 'admin')
        ");
        
        // admin123 のハッシュ
        $password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        $stmt->execute([$password_hash]);
        
        echo "✓ 成功: デフォルト管理者アカウントを作成しました\n\n";
        echo "ログイン情報:\n";
        echo "  メール: admin@example.com\n";
        echo "  パスワード: admin123\n";
    }
    
} else {
    echo "\n使い方:\n";
    echo "----------------------------------------\n";
    echo "1. ユーザーを管理者に昇格:\n";
    echo "   ?action=promote&user_id=ユーザーID\n\n";
    echo "2. ユーザーを一般に降格:\n";
    echo "   ?action=demote&user_id=ユーザーID\n\n";
    echo "3. デフォルト管理者を作成:\n";
    echo "   ?action=create_admin\n\n";
    echo "例: user_admin.php?action=promote&user_id=2\n";
}
?>
