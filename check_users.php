<?php
require_once 'config/db.php';

echo "=== ユーザー一覧 ===\n\n";

$stmt = $pdo->query('SELECT id, name, email, role FROM users');
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($users)) {
    echo "ユーザーが登録されていません。\n";
} else {
    foreach ($users as $user) {
        echo "ID: {$user['id']}\n";
        echo "名前: {$user['name']}\n";
        echo "メール: {$user['email']}\n";
        echo "権限: {$user['role']}\n";
        echo "---\n";
    }
}

// 管理者パスワードを修正（admin123をハッシュ化して更新）
echo "\n=== 管理者パスワードを再設定 ===\n";
$new_password = password_hash('admin123', PASSWORD_DEFAULT);
$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@example.com'");
$result = $stmt->execute([$new_password]);

if ($result) {
    echo "✓ 管理者パスワードを再設定しました\n";
    echo "  メール: admin@example.com\n";
    echo "  パスワード: admin123\n";
} else {
    echo "✗ パスワードの更新に失敗しました\n";
}
