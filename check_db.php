<?php
// データベース確認ツール
require_once 'config/db.php';

echo "<h2>データベース確認</h2>";

// ユーザー一覧を表示
echo "<h3>ユーザー一覧:</h3>";
try {
    $stmt = $pdo->query("SELECT id, name, email, role FROM users");
    $users = $stmt->fetchAll();
    
    if (count($users) > 0) {
        echo "<table border='1' style='border-collapse: collapse; padding: 5px;'>";
        echo "<tr><th>ID</th><th>名前</th><th>メール</th><th>ロール</th></tr>";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['name']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['role']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>ユーザーが登録されていません。</p>";
    }
} catch (PDOException $e) {
    echo "<p>エラー: " . $e->getMessage() . "</p>";
}

// パスワードハッシュをテスト
echo "<h3>パスワードテスト:</h3>";
$test_password = 'admin123';
$stored_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

if (password_verify($test_password, $stored_hash)) {
    echo "<p style='color: green;'>✓ パスワードハッシュは正常に動作しています</p>";
} else {
    echo "<p style='color: red;'>✗ パスワードハッシュが一致しません</p>";
}

// 新しいハッシュを生成
$new_hash = password_hash('admin123', PASSWORD_DEFAULT);
echo "<p>新しいハッシュ: <code>$new_hash</code></p>";
?>
