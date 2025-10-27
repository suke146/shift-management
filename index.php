<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>シフト管理システム - ログイン</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="login-box">
            <h1>シフト管理システム</h1>
            <div class="tab-container">
                <button class="tab-button active" onclick="showTab('login')">ログイン</button>
                <button class="tab-button" onclick="showTab('register')">新規登録</button>
            </div>
            
            <!-- ログインフォーム -->
            <div id="login-tab" class="tab-content active">
                <form id="loginForm" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="login-email">メールアドレス</label>
                        <input type="email" id="login-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">パスワード</label>
                        <input type="password" id="login-password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">ログイン</button>
                </form>
                <div id="login-message" class="message"></div>
            </div>
            
            <!-- 新規登録フォーム -->
            <div id="register-tab" class="tab-content">
                <form id="registerForm" onsubmit="handleRegister(event)">
                    <div class="form-group">
                        <label for="register-name">名前</label>
                        <input type="text" id="register-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email">メールアドレス</label>
                        <input type="email" id="register-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">パスワード</label>
                        <input type="password" id="register-password" name="password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="register-password-confirm">パスワード確認</label>
                        <input type="password" id="register-password-confirm" name="password_confirm" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary">登録</button>
                </form>
                <div id="register-message" class="message"></div>
            </div>
        </div>
    </div>
    
    <script src="js/auth.js"></script>
</body>
</html>
