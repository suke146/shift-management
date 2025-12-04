<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

require_once 'config/db.php';

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT name, email, role FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

$is_admin = ($user['role'] === 'admin');
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ダッシュボード - シフト管理システム</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <h1>シフト管理システム</h1>
            <div class="nav-links">
                <span class="user-info">ようこそ、<?php echo htmlspecialchars($user['name']); ?>さん</span>
                <a href="logout.php" class="btn btn-secondary">ログアウト</a>
            </div>
        </div>
    </nav>
    
    <div class="main-container">
        <aside class="sidebar">
            <ul class="menu">
                <li><a href="#" onclick="showPage('shift-submit')" class="menu-item active">シフト提出</a></li>
                <li><a href="#" onclick="showPage('shift-view')" class="menu-item">シフト閲覧</a></li>
                <?php if ($is_admin): ?>
                <li><a href="#" onclick="showPage('shift-manage')" class="menu-item">シフト管理</a></li>
                <li><a href="#" onclick="showPage('user-manage')" class="menu-item">メンバー管理</a></li>
                <?php endif; ?>
            </ul>
        </aside>
        
        <main class="content">
            <!-- シフト提出ページ -->
            <div id="shift-submit-page" class="page active">
                <h2>シフト提出</h2>
                <div class="card">
                    <form id="shiftSubmitForm" onsubmit="submitShift(event)">
                        <div class="form-group">
                            <label>対象期間（半月ごと: 1日～15日 / 16日～月末）</label>
                            <input type="date" id="shift-week" name="period" required>
                            <small>※選択した日付が含まれる半月期間のシフトを提出します</small>
                        </div>
                        <div class="form-group">
                            <label>勤務可能日時（15分刻み）</label>
                            <div id="shift-days-container"></div>
                        </div>
                        <button type="submit" class="btn btn-primary">シフトを提出</button>
                    </form>
                    <div id="submit-message" class="message"></div>
                </div>
            </div>
            
            <!-- シフト閲覧ページ -->
            <div id="shift-view-page" class="page">
                <h2>シフト閲覧</h2>
                <div class="card">
                    <div class="week-selector">
                        <button onclick="changeWeek(-1)" class="btn btn-secondary">前の半月</button>
                        <span id="current-week-display"></span>
                        <button onclick="changeWeek(1)" class="btn btn-secondary">次の半月</button>
                    </div>
                    <div id="shift-table-container" class="table-container"></div>
                    <h3>提出状況（他のメンバー）</h3>
                    <div id="submissions-public-container" class="table-container"></div>
                </div>
            </div>
            
            <?php if ($is_admin): ?>
            <!-- シフト管理ページ -->
            <div id="shift-manage-page" class="page">
                <h2>シフト管理</h2>
                <div class="card">
                    <div class="week-selector">
                        <button onclick="changeManageWeek(-1)" class="btn btn-secondary">前の半月</button>
                        <span id="manage-week-display"></span>
                        <button onclick="changeManageWeek(1)" class="btn btn-secondary">次の半月</button>
                    </div>
                    
                    <h3>提出状況（参考）</h3>
                    <div id="manage-submissions-container"></div>
                    
                    <h3>シフト作成</h3>
                    <p class="help-text">日付を選択してメンバーを追加し、時刻を入力してください</p>
                    <div id="shift-builder-container"></div>
                    
                    <button onclick="saveFinalShifts()" class="btn btn-success">確定シフトを保存</button>
                    <div id="manage-message" class="message"></div>
                </div>
            </div>
            
            <!-- メンバー管理ページ -->
            <div id="user-manage-page" class="page">
                <h2>メンバー管理</h2>
                <div class="card">
                    <div id="users-list-container"></div>
                </div>
            </div>
            <?php endif; ?>
        </main>
    </div>
    
    <script>
        const isAdmin = <?php echo $is_admin ? 'true' : 'false'; ?>;
        const userId = <?php echo $user_id; ?>;
    </script>
    <script src="js/dashboard.js"></script>
    <script src="js/shift.js"></script>
    <?php if ($is_admin): ?>
    <script src="js/admin.js"></script>
    <?php endif; ?>
</body>
</html>
