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
                <li><a href="#" onclick="showPage('shift-all')" class="menu-item">シフト希望一覧</a></li>
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
                            <div class="week-selector">
                                <button type="button" onclick="changeSubmitWeek(-1)" class="btn btn-secondary">前の半月</button>
                                <span id="submit-week-display"></span>
                                <button type="button" onclick="changeSubmitWeek(1)" class="btn btn-secondary">次の半月</button>
                            </div>
                            <small>※ボタンで半月単位の期間を切り替えます</small>
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
                
                <!-- タブ切り替え -->
                <div class="tab-container">
                    <button class="tab-btn active" onclick="switchViewTab('final')">確定シフト</button>
                    <button class="tab-btn" onclick="switchViewTab('requests')">希望シフト一覧</button>
                </div>
                
                <!-- 確定シフト表示 -->
                <div id="final-shift-view" class="card tab-content active">
                    <!-- 表示モード選択 -->
                    <div class="view-mode-selector">
                        <label>
                            <input type="radio" name="final-view-mode" value="daily" onchange="switchFinalViewMode(this.value)">
                            1日
                        </label>
                        <label>
                            <input type="radio" name="final-view-mode" value="weekly" onchange="switchFinalViewMode(this.value)">
                            1週間
                        </label>
                        <label>
                            <input type="radio" name="final-view-mode" value="half-month" checked onchange="switchFinalViewMode(this.value)">
                            半月
                        </label>
                    </div>
                    
                    <!-- 1日表示 -->
                    <div id="final-daily-view" class="view-mode-content">
                        <div class="date-selector">
                            <button onclick="changeFinalDay(-1)" class="btn btn-secondary">◀ 前日</button>
                            <input type="date" id="final-date-input" onchange="loadFinalDayShift()">
                            <button onclick="changeFinalDay(1)" class="btn btn-secondary">翌日 ▶</button>
                        </div>
                        <div id="final-daily-container" class="table-container"></div>
                    </div>
                    
                    <!-- 1週間表示 -->
                    <div id="final-weekly-view" class="view-mode-content">
                        <div class="week-selector">
                            <button onclick="changeFinalWeek(-1)" class="btn btn-secondary">◀ 前週</button>
                            <span id="final-week-display"></span>
                            <button onclick="changeFinalWeek(1)" class="btn btn-secondary">翌週 ▶</button>
                        </div>
                        <div id="final-weekly-container" class="table-container"></div>
                    </div>
                    
                    <!-- 半月表示 -->
                    <div id="final-half-month-view" class="view-mode-content active">
                        <div class="week-selector">
                            <button onclick="changeWeek(-1)" class="btn btn-secondary">◀ 前の半月</button>
                            <span id="current-week-display"></span>
                            <button onclick="changeWeek(1)" class="btn btn-secondary">次の半月 ▶</button>
                        </div>
                        <div id="shift-table-container" class="table-container"></div>
                    </div>
                </div>
                
                <!-- 希望シフト一覧表示 -->
                <div id="requests-shift-view" class="card tab-content">
                    <!-- 表示モード選択 -->
                    <div class="view-mode-selector">
                        <label>
                            <input type="radio" name="request-view-mode" value="daily" onchange="switchRequestViewMode(this.value)">
                            1日
                        </label>
                        <label>
                            <input type="radio" name="request-view-mode" value="weekly" onchange="switchRequestViewMode(this.value)">
                            1週間
                        </label>
                        <label>
                            <input type="radio" name="request-view-mode" value="half-month" checked onchange="switchRequestViewMode(this.value)">
                            半月
                        </label>
                    </div>
                    
                    <!-- 1日表示 -->
                    <div id="request-daily-view" class="view-mode-content">
                        <div class="date-selector">
                            <button onclick="changeRequestDay(-1)" class="btn btn-secondary">◀ 前日</button>
                            <input type="date" id="request-date-input" onchange="loadRequestDayShift()">
                            <button onclick="changeRequestDay(1)" class="btn btn-secondary">翌日 ▶</button>
                        </div>
                        <div id="request-daily-container" class="table-container"></div>
                    </div>
                    
                    <!-- 1週間表示 -->
                    <div id="request-weekly-view" class="view-mode-content">
                        <div class="week-selector">
                            <button onclick="changeRequestWeekly(-1)" class="btn btn-secondary">◀ 前週</button>
                            <span id="request-week-display"></span>
                            <button onclick="changeRequestWeekly(1)" class="btn btn-secondary">翌週 ▶</button>
                        </div>
                        <div id="request-weekly-container" class="table-container"></div>
                    </div>
                    
                    <!-- 半月表示 -->
                    <div id="request-half-month-view" class="view-mode-content active">
                        <div class="week-selector">
                            <button onclick="changeRequestWeek(-1)" class="btn btn-secondary">◀ 前の半月</button>
                            <span id="request-week-display2"></span>
                            <button onclick="changeRequestWeek(1)" class="btn btn-secondary">次の半月 ▶</button>
                        </div>
                        <div id="request-table-container" class="table-container"></div>
                    </div>
                </div>
            </div>
            
            <!-- シフト希望一覧ページ（全員分） -->
            <div id="shift-all-page" class="page">
                <h2>シフト希望一覧</h2>
                <div class="card">
                    <div class="week-selector">
                        <button onclick="changeAllWeek(-1)" class="btn btn-secondary">前の半月</button>
                        <span id="all-week-display"></span>
                        <button onclick="changeAllWeek(1)" class="btn btn-secondary">次の半月</button>
                    </div>
                    <div id="all-shifts-container" class="table-container"></div>
                </div>
            </div>

            <?php if ($is_admin): ?>
            <!-- シフト管理ページ -->
            <div id="shift-manage-page" class="page">
                <h2>シフト管理</h2>
                
                <!-- タブ切り替え -->
                <div class="tab-container">
                    <button class="tab-btn active" onclick="switchManageTab('requests')">提出済みシフトから作成</button>
                    <button class="tab-btn" onclick="switchManageTab('manual')">メンバーから直接作成</button>
                </div>
                
                <!-- 提出済みシフトから作成 -->
                <div id="manage-requests" class="card tab-content active">
                    <!-- 期間モード切り替え -->
                    <div class="mode-selector">
                        <label>
                            <input type="radio" name="requests-mode" value="half-month" checked onchange="switchRequestsMode(this.value)">
                            半月ごと
                        </label>
                        <label>
                            <input type="radio" name="requests-mode" value="daily" onchange="switchRequestsMode(this.value)">
                            1日ごと
                        </label>
                    </div>
                    
                    <!-- 半月モード -->
                    <div id="requests-half-month-mode" class="period-mode active">
                        <div class="week-selector">
                            <button onclick="changeManageWeek(-1)" class="btn btn-secondary">前の半月</button>
                            <span id="manage-week-display"></span>
                            <button onclick="changeManageWeek(1)" class="btn btn-secondary">次の半月</button>
                        </div>
                        <div id="manage-shifts-container"></div>
                        <button onclick="createFinalShift()" class="btn btn-success">確定シフトを作成</button>
                        <div id="manage-message" class="message"></div>
                    </div>
                    
                    <!-- 1日モード -->
                    <div id="requests-daily-mode" class="period-mode">
                        <div class="date-selector">
                            <button onclick="changeManageDay(-1)" class="btn btn-secondary">前日</button>
                            <input type="date" id="manage-date-input" onchange="loadDailySubmissions()">
                            <button onclick="changeManageDay(1)" class="btn btn-secondary">翌日</button>
                        </div>
                        <div id="manage-daily-container"></div>
                        <button onclick="createDailyFinalShift()" class="btn btn-success">この日のシフトを確定</button>
                        <div id="manage-daily-message" class="message"></div>
                    </div>
                </div>
                
                <!-- メンバーから直接作成 -->
                <div id="manage-manual" class="card tab-content">
                    <!-- 期間モード切り替え -->
                    <div class="mode-selector">
                        <label>
                            <input type="radio" name="manual-mode" value="half-month" checked onchange="switchManualMode(this.value)">
                            半月ごと
                        </label>
                        <label>
                            <input type="radio" name="manual-mode" value="daily" onchange="switchManualMode(this.value)">
                            1日ごと
                        </label>
                    </div>
                    
                    <!-- 半月モード -->
                    <div id="manual-half-month-mode" class="period-mode active">
                        <div class="week-selector">
                            <button onclick="changeManualWeek(-1)" class="btn btn-secondary">前の半月</button>
                            <span id="manual-week-display"></span>
                            <button onclick="changeManualWeek(1)" class="btn btn-secondary">次の半月</button>
                        </div>
                        <div id="manual-shifts-container"></div>
                        <button onclick="createManualShift()" class="btn btn-success">確定シフトを作成</button>
                        <div id="manual-message" class="message"></div>
                    </div>
                    
                    <!-- 1日モード -->
                    <div id="manual-daily-mode" class="period-mode">
                        <div class="date-selector">
                            <button onclick="changeManualDay(-1)" class="btn btn-secondary">前日</button>
                            <input type="date" id="manual-date-input" onchange="renderManualDailyForm()">
                            <button onclick="changeManualDay(1)" class="btn btn-secondary">翌日</button>
                        </div>
                        <div id="manual-daily-container"></div>
                        <button onclick="createManualDailyShift()" class="btn btn-success">この日のシフトを確定</button>
                        <div id="manual-daily-message" class="message"></div>
                    </div>
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
