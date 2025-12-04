// 管理者専用機能

// シフト管理の初期化
// HTML を安全に表示するためのエスケープ
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function initShiftManage() {
    console.log('initShiftManage called');
    updateManagePeriodDisplay();
    loadSubmissionsForReference();
    await loadAllUsersForShiftBuilder();
    initShiftBuilder();
}

// 管理期間の表示を更新
function updateManagePeriodDisplay() {
    const display = document.getElementById('manage-week-display');
    const endDate = getPeriodEnd(currentManagePeriod);
    
    display.textContent = `${formatDate(currentManagePeriod)} 〜 ${formatDate(endDate)}`;
}

// 管理期間を変更（半月単位）
function changeManageWeek(offset) {
    if (offset > 0) {
        // 次の半月
        const day = currentManagePeriod.getDate();
        if (day === 1) {
            currentManagePeriod.setDate(16);
        } else {
            currentManagePeriod.setMonth(currentManagePeriod.getMonth() + 1);
            currentManagePeriod.setDate(1);
        }
    } else {
        // 前の半月
        const day = currentManagePeriod.getDate();
        if (day === 16) {
            currentManagePeriod.setDate(1);
        } else {
            currentManagePeriod.setMonth(currentManagePeriod.getMonth() - 1);
            currentManagePeriod.setDate(16);
        }
    }
    
    updateManagePeriodDisplay();
    loadSubmissionsForReference();
    loadAllUsersForShiftBuilder().then(() => {
        initShiftBuilder();
    });
}

// 提出状況を参考情報として読み込み
async function loadSubmissionsForReference() {
    const container = document.getElementById('manage-submissions-container');
    if (!container) {
        console.error('manage-submissions-container not found!');
        return;
    }
    const periodStart = formatDate(currentManagePeriod);
    
    try {
        const response = await fetch(`api/admin.php?action=get_all_submissions&period_start=${periodStart}`);
        const data = await response.json();
        
        if (data.success) {
            displaySubmissionsReference(container, data.submissions, new Date(periodStart));
        } else {
            container.innerHTML = '<p>シフト提出の読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
    }
}

// 提出状況を参考表示
function displaySubmissionsReference(container, submissions, periodStart) {
    if (submissions.length === 0) {
        container.innerHTML = '<p>この期間のシフト提出はまだありません</p>';
        return;
    }
    
    const dates = getPeriodDates(periodStart);
    
    // ユーザーごとにグループ化
    const submissionsByUser = {};
    submissions.forEach(sub => {
        if (!submissionsByUser[sub.user_name]) {
            submissionsByUser[sub.user_name] = {
                user_id: sub.user_id,
                dates: {}
            };
        }
        submissionsByUser[sub.user_name].dates[sub.shift_date] = sub;
    });
    
    // テーブルを生成
    let html = '<div class="table-container"><table><thead><tr>';
    html += '<th>名前</th>';
    
    // 日付ヘッダー
    dates.forEach(date => {
        const dayOfWeek = date.getDay();
        html += `<th>${dayNames[dayOfWeek]}<br>${formatDate(date).substring(5)}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // 各ユーザーの行
    for (const [userName, userData] of Object.entries(submissionsByUser)) {
        html += `<tr><td><strong>${userName}</strong></td>`;
        
        dates.forEach(date => {
            const dateStr = formatDate(date);
            const day = userData.dates[dateStr];
            html += '<td>';
            
            if (day && day.is_available) {
                html += `<div class="shift-submission" style="background: #f0f8ff; padding: 5px; border-radius: 3px;">
                    ${day.start_time ? day.start_time.substring(0, 5) : '--:--'} - 
                    ${day.end_time ? day.end_time.substring(0, 5) : '--:--'}
                </div>`;
                if (day && day.note) {
                    html += `<div class="submission-note" style="font-size: 11px; color: #666; margin-top: 3px;">${escapeHtml(day.note)}</div>`;
                }
            } else if (day) {
                html += '<span style="color: #999;">休み希望</span>';
                if (day.note) {
                    html += `<div style="font-size: 11px; color: #666;">${escapeHtml(day.note)}</div>`;
                }
            } else {
                html += '<span style="color: #ccc;">-</span>';
            }
            
            html += '</td>';
        });
        
        html += '</tr>';
    }
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// シフトビルダー用の全ユーザーを読み込み
let allUsers = [];
async function loadAllUsersForShiftBuilder() {
    console.log('loadAllUsersForShiftBuilder called');
    try {
        const response = await fetch('api/admin.php?action=get_users');
        const data = await response.json();
        console.log('All users for shift builder:', data);
        
        if (data.success) {
            allUsers = data.users;
            console.log('Loaded ' + allUsers.length + ' users');
        } else {
            console.error('Failed to load users:', data.message);
        }
    } catch (error) {
        console.error('ユーザー読み込みエラー:', error);
    }
}

// シフトビルダーの初期化
let shiftBuilderRows = [];
function initShiftBuilder() {
    console.log('initShiftBuilder called, allUsers count:', allUsers.length);
    shiftBuilderRows = [];
    renderShiftBuilder();
}

// シフトビルダーを描画
function renderShiftBuilder() {
    const container = document.getElementById('shift-builder-container');
    if (!container) {
        console.error('shift-builder-container not found!');
        return;
    }
    console.log('renderShiftBuilder called, rows:', shiftBuilderRows.length, 'users:', allUsers.length);
    
    const dates = getPeriodDates(currentManagePeriod);
    
    let html = '<div class="shift-builder">';
    
    if (shiftBuilderRows.length === 0) {
        html += '<p class="no-shifts">シフトを追加してください</p>';
    } else {
        shiftBuilderRows.forEach((row, index) => {
            html += `<div class="shift-builder-row">
                <div class="form-group">
                    <label>日付</label>
                    <select class="shift-date" data-index="${index}">
                        ${dates.map(d => {
                            const dateStr = formatDate(d);
                            const dayOfWeek = d.getDay();
                            const selected = row.date === dateStr ? 'selected' : '';
                            return `<option value="${dateStr}" ${selected}>${dateStr} (${dayNames[dayOfWeek]})</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>メンバー</label>
                    <select class="shift-user" data-index="${index}">
                        <option value="">選択してください</option>
                        ${allUsers.map(u => {
                            const selected = row.userId == u.id ? 'selected' : '';
                            return `<option value="${u.id}" ${selected}>${u.name}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>開始時刻</label>
                    <input type="time" class="shift-start" data-index="${index}" value="${row.startTime || '09:00'}" step="900">
                </div>
                <div class="form-group">
                    <label>終了時刻</label>
                    <input type="time" class="shift-end" data-index="${index}" value="${row.endTime || '18:00'}" step="900">
                </div>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeShiftBuilderRow(${index})">削除</button>
            </div>`;
        });
    }
    
    html += '<button type="button" class="btn btn-secondary" onclick="addShiftBuilderRow()">+ シフトを追加</button>';
    html += '</div>';
    
    container.innerHTML = html;
    
    // イベントリスナーを設定
    setupShiftBuilderListeners();
}

// シフトビルダーのイベントリスナー
function setupShiftBuilderListeners() {
    document.querySelectorAll('.shift-date, .shift-user, .shift-start, .shift-end').forEach(el => {
        el.addEventListener('change', updateShiftBuilderData);
    });
}

// シフトビルダーのデータを更新
function updateShiftBuilderData() {
    shiftBuilderRows.forEach((row, index) => {
        const dateEl = document.querySelector(`.shift-date[data-index="${index}"]`);
        const userEl = document.querySelector(`.shift-user[data-index="${index}"]`);
        const startEl = document.querySelector(`.shift-start[data-index="${index}"]`);
        const endEl = document.querySelector(`.shift-end[data-index="${index}"]`);
        
        if (dateEl) row.date = dateEl.value;
        if (userEl) row.userId = userEl.value;
        if (startEl) row.startTime = startEl.value;
        if (endEl) row.endTime = endEl.value;
    });
}

// シフトビルダーに行を追加
function addShiftBuilderRow() {
    const dates = getPeriodDates(currentManagePeriod);
    shiftBuilderRows.push({
        date: formatDate(dates[0]),
        userId: '',
        startTime: '09:00',
        endTime: '18:00'
    });
    renderShiftBuilder();
}

// シフトビルダーから行を削除
function removeShiftBuilderRow(index) {
    shiftBuilderRows.splice(index, 1);
    renderShiftBuilder();
}

// 確定シフトを保存
async function saveFinalShifts() {
    updateShiftBuilderData();
    
    // バリデーション
    const validShifts = shiftBuilderRows.filter(row => row.userId && row.date);
    
    if (validShifts.length === 0) {
        alert('少なくとも1つのシフトを作成してください（メンバーと日付を選択）');
        return;
    }
    
    // 確認メッセージ
    const shiftCount = validShifts.length;
    const userIds = [...new Set(validShifts.map(s => s.userId))];
    const userNames = userIds.map(id => {
        const user = allUsers.find(u => u.id == id);
        return user ? user.name : '';
    }).filter(n => n);
    
    const summary = `${shiftCount}件のシフトを確定します。\n対象メンバー: ${userNames.join(', ')}`;
    
    if (!confirm(summary + '\n\nよろしいですか？')) {
        return;
    }
    
    const shifts = validShifts.map(row => ({
        user_id: parseInt(row.userId),
        shift_date: row.date,
        start_time: row.startTime,
        end_time: row.endTime
    }));
    
    const messageDiv = document.getElementById('manage-message');
    
    try {
        const response = await fetch('api/admin.php?action=create_final_shifts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shifts: shifts })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, data.message, 'success');
            // シフトビルダーをクリア
            shiftBuilderRows = [];
            renderShiftBuilder();
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        console.error('Error creating shifts:', error);
        showMessage(messageDiv, '通信エラーが発生しました: ' + error.message, 'error');
    }
}

// ユーザー一覧を読み込み
async function loadUsers() {
    const container = document.getElementById('users-list-container');
    console.log('loadUsers called');
    
    if (!container) {
        console.error('users-list-container not found!');
        return;
    }
    
    try {
        const response = await fetch('api/admin.php?action=get_users');
        console.log('Users API response:', response.status);
        const data = await response.json();
        console.log('Users data:', data);
        
        if (data.success) {
            displayUsers(container, data.users);
        } else {
            container.innerHTML = `<p>ユーザーの読み込みに失敗しました: ${data.message || ''}</p>`;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = `<p>通信エラーが発生しました: ${error.message}</p>`;
    }
}

// ユーザー一覧を表示
function displayUsers(container, users) {
    let html = '';
    
    users.forEach(user => {
        const badgeClass = user.role === 'admin' ? 'badge-admin' : 'badge-user';
        const roleText = user.role === 'admin' ? '管理者' : '一般ユーザー';
        
        html += `
            <div class="user-card">
                <div class="user-info-block">
                    <h3>${user.name} <span class="badge ${badgeClass}">${roleText}</span></h3>
                    <p>${user.email}</p>
                    <p>登録日: ${user.created_at.substring(0, 10)}</p>
                </div>
                <div class="user-actions">
                    <select onchange="updateUserRole(${user.id}, this.value)" class="form-control">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>一般ユーザー</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理者</option>
                    </select>
                    <button onclick="deleteUser(${user.id}, '${user.name}')" class="btn btn-danger">削除</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ユーザーロールを更新
async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch('api/admin.php?action=update_role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                role: newRole
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            loadUsers(); // リロード
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('通信エラーが発生しました');
    }
}

// 提出ステータスを更新（承認/却下）
async function updateSubmissionStatus(userId, shiftDate, periodStart, newStatus) {
    try {
        const response = await fetch(`api/admin.php?action=update_submission_status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                shift_date: shiftDate,
                period_start: periodStart,
                status: newStatus
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            loadAllSubmissions();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('通信エラーが発生しました');
    }
}

// ユーザーを削除
async function deleteUser(userId, userName) {
    if (!confirm(`${userName}を削除しますか?この操作は取り消せません。`)) {
        return;
    }
    
    try {
        const response = await fetch('api/admin.php?action=delete_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            loadUsers(); // リロード
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('通信エラーが発生しました');
    }
}

// 手動シフト作成の初期化
let currentManualPeriod = getPeriodStart(new Date());
let manualShiftRows = [];
let allUsers = [];

async function initManualShiftCreation() {
    updateManualPeriodDisplay();
    await loadAllUsers();
    addManualShiftRow();
}

// 手動シフト期間の表示を更新
function updateManualPeriodDisplay() {
    const display = document.getElementById('manual-week-display');
    const endDate = getPeriodEnd(currentManualPeriod);
    
    display.textContent = `${formatDate(currentManualPeriod)} 〜 ${formatDate(endDate)}`;
}

// 手動シフト期間を変更
function changeManualWeek(offset) {
    if (offset > 0) {
        const day = currentManualPeriod.getDate();
        if (day === 1) {
            currentManualPeriod.setDate(16);
        } else {
            currentManualPeriod.setMonth(currentManualPeriod.getMonth() + 1);
            currentManualPeriod.setDate(1);
        }
    } else {
        const day = currentManualPeriod.getDate();
        if (day === 16) {
            currentManualPeriod.setDate(1);
        } else {
            currentManualPeriod.setMonth(currentManualPeriod.getMonth() - 1);
            currentManualPeriod.setDate(16);
        }
    }
    
    updateManualPeriodDisplay();
    manualShiftRows = [];
    initManualShiftCreation();
}

// 全ユーザーを読み込み
async function loadAllUsers() {
    try {
        const response = await fetch('api/admin.php?action=get_users');
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
        }
    } catch (error) {
        console.error('ユーザー読み込みエラー:', error);
    }
}

// 手動シフト行を追加
function addManualShiftRow() {
    const rowId = Date.now();
    manualShiftRows.push(rowId);
    renderManualShiftForm();
}

// 手動シフト行を削除
function removeManualShiftRow(rowId) {
    manualShiftRows = manualShiftRows.filter(id => id !== rowId);
    renderManualShiftForm();
}

// 手動シフトフォームを描画
function renderManualShiftForm() {
    const container = document.getElementById('manual-shifts-container');
    const dates = getPeriodDates(currentManualPeriod);
    
    let html = '<div class="manual-shift-form">';
    
    manualShiftRows.forEach(rowId => {
        html += `<div class="shift-input-group">
            <div>
                <label>メンバー</label>
                <select class="user-select" data-row="${rowId}">
                    <option value="">選択してください</option>
                    ${allUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label>日付</label>
                <select class="date-select" data-row="${rowId}">
                    ${dates.map(d => {
                        const dateStr = formatDate(d);
                        const dayOfWeek = d.getDay();
                        return `<option value="${dateStr}">${dateStr} (${dayNames[dayOfWeek]})</option>`;
                    }).join('')}
                </select>
            </div>
            <div>
                <label>開始時刻</label>
                <input type="time" class="start-time" data-row="${rowId}" value="09:00" step="900">
            </div>
            <div>
                <label>終了時刻</label>
                <input type="time" class="end-time" data-row="${rowId}" value="18:00" step="900">
            </div>
            <div>
                <button type="button" class="remove-shift-btn" onclick="removeManualShiftRow(${rowId})">削除</button>
            </div>
        </div>`;
    });
    
    html += `<button type="button" class="btn btn-secondary add-shift-row-btn" onclick="addManualShiftRow()">
        + シフト行を追加
    </button>`;
    html += '</div>';
    
    container.innerHTML = html;
}

// 手動シフトを作成
async function createManualShift() {
    const shifts = [];
    
    manualShiftRows.forEach(rowId => {
        const userSelect = document.querySelector(`.user-select[data-row="${rowId}"]`);
        const dateSelect = document.querySelector(`.date-select[data-row="${rowId}"]`);
        const startSelect = document.querySelector(`.start-time[data-row="${rowId}"]`);
        const endSelect = document.querySelector(`.end-time[data-row="${rowId}"]`);
        
        if (userSelect.value && dateSelect.value) {
            shifts.push({
                user_id: parseInt(userSelect.value),
                shift_date: dateSelect.value,
                start_time: startSelect.value,
                end_time: endSelect.value
            });
        }
    });
    
    if (shifts.length === 0) {
        alert('シフトを1件以上作成してください');
        return;
    }
    
    const messageDiv = document.getElementById('manual-message');
    
    try {
        const response = await fetch('api/admin.php?action=create_final_shifts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shifts: shifts })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, data.message, 'success');
            manualShiftRows = [];
            initManualShiftCreation();
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageDiv, '通信エラーが発生しました', 'error');
    }
}

// === 提出済みシフトから作成（1日モード） ===
let currentManageDay = new Date();

function switchRequestsMode(mode) {
    const halfMonthMode = document.getElementById('requests-half-month-mode');
    const dailyMode = document.getElementById('requests-daily-mode');
    
    if (mode === 'half-month') {
        halfMonthMode.classList.add('active');
        dailyMode.classList.remove('active');
        loadAllSubmissions();
    } else {
        halfMonthMode.classList.remove('active');
        dailyMode.classList.add('active');
        initDailyManagement();
    }
}

function initDailyManagement() {
    currentManageDay = new Date();
    document.getElementById('manage-date-input').value = formatDate(currentManageDay);
    loadDailySubmissions();
}

function changeManageDay(offset) {
    currentManageDay.setDate(currentManageDay.getDate() + offset);
    document.getElementById('manage-date-input').value = formatDate(currentManageDay);
    loadDailySubmissions();
}

async function loadDailySubmissions() {
    const dateInput = document.getElementById('manage-date-input');
    currentManageDay = new Date(dateInput.value);
    const container = document.getElementById('manage-daily-container');
    const dateStr = formatDate(currentManageDay);
    
    try {
        const response = await fetch(`api/admin.php?action=get_daily_submissions&date=${dateStr}`);
        const data = await response.json();
        
        if (data.success) {
            displayDailySubmissions(container, data.submissions, dateStr);
        } else {
            container.innerHTML = '<p>データの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
    }
}

function displayDailySubmissions(container, submissions, dateStr) {
    if (submissions.length === 0) {
        container.innerHTML = '<p>この日の希望シフトはありません</p>';
        return;
    }
    
    const dayOfWeek = new Date(dateStr).getDay();
    
    let html = `<h3>${dateStr} (${dayNames[dayOfWeek]})</h3>`;
    html += '<div class="daily-submissions">';
    
    submissions.forEach(sub => {
        html += `<div class="daily-submission-card">
            <div class="submission-info">
                <strong>${sub.user_name}</strong>
                ${sub.is_available ? 
                    `<span class="time-badge">${sub.start_time.substring(0, 5)} - ${sub.end_time.substring(0, 5)}</span>` :
                    '<span class="unavailable-badge">勤務不可</span>'
                }
            </div>
            ${sub.is_available ? 
                `<input type="checkbox" class="assign-daily-shift" 
                    data-user-id="${sub.user_id}"
                    data-date="${dateStr}"
                    data-start="${sub.start_time}"
                    data-end="${sub.end_time}">` :
                ''
            }
        </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

async function createDailyFinalShift() {
    const checkboxes = document.querySelectorAll('.assign-daily-shift:checked');
    
    if (checkboxes.length === 0) {
        alert('シフトを選択してください');
        return;
    }
    
    const shifts = [];
    checkboxes.forEach(checkbox => {
        shifts.push({
            user_id: parseInt(checkbox.dataset.userId),
            shift_date: checkbox.dataset.date,
            start_time: checkbox.dataset.start,
            end_time: checkbox.dataset.end
        });
    });
    
    const messageDiv = document.getElementById('manage-daily-message');
    
    try {
        const response = await fetch('api/admin.php?action=create_final_shifts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shifts: shifts })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, data.message, 'success');
            loadDailySubmissions();
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageDiv, '通信エラーが発生しました', 'error');
    }
}

// === メンバーから直接作成（1日モード） ===
let currentManualDay = new Date();
let manualDailyRows = [];

function switchManualMode(mode) {
    const halfMonthMode = document.getElementById('manual-half-month-mode');
    const dailyMode = document.getElementById('manual-daily-mode');
    
    if (mode === 'half-month') {
        halfMonthMode.classList.add('active');
        dailyMode.classList.remove('active');
        manualShiftRows = [];
        initManualShiftCreation();
    } else {
        halfMonthMode.classList.remove('active');
        dailyMode.classList.add('active');
        initManualDailyCreation();
    }
}

async function initManualDailyCreation() {
    currentManualDay = new Date();
    document.getElementById('manual-date-input').value = formatDate(currentManualDay);
    await loadAllUsers();
    manualDailyRows = [];
    addManualDailyRow();
}

function changeManualDay(offset) {
    currentManualDay.setDate(currentManualDay.getDate() + offset);
    document.getElementById('manual-date-input').value = formatDate(currentManualDay);
    renderManualDailyForm();
}

function addManualDailyRow() {
    const rowId = Date.now();
    manualDailyRows.push(rowId);
    renderManualDailyForm();
}

function removeManualDailyRow(rowId) {
    manualDailyRows = manualDailyRows.filter(id => id !== rowId);
    renderManualDailyForm();
}

function renderManualDailyForm() {
    const container = document.getElementById('manual-daily-container');
    const dateInput = document.getElementById('manual-date-input');
    currentManualDay = new Date(dateInput.value);
    const dateStr = formatDate(currentManualDay);
    const dayOfWeek = currentManualDay.getDay();
    
    let html = `<h3>${dateStr} (${dayNames[dayOfWeek]})</h3>`;
    html += '<div class="manual-shift-form">';
    
    manualDailyRows.forEach(rowId => {
        html += `<div class="shift-input-group daily-shift-group">
            <div>
                <label>メンバー</label>
                <select class="user-select-daily" data-row="${rowId}">
                    <option value="">選択してください</option>
                    ${allUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label>開始時刻</label>
                <input type="time" class="start-time-daily" data-row="${rowId}" value="09:00" step="900">
            </div>
            <div>
                <label>終了時刻</label>
                <input type="time" class="end-time-daily" data-row="${rowId}" value="18:00" step="900">
            </div>
            <div>
                <button type="button" class="remove-shift-btn" onclick="removeManualDailyRow(${rowId})">削除</button>
            </div>
        </div>`;
    });
    
    html += `<button type="button" class="btn btn-secondary add-shift-row-btn" onclick="addManualDailyRow()">
        + スタッフを追加
    </button>`;
    html += '</div>';
    
    container.innerHTML = html;
}

async function createManualDailyShift() {
    const dateInput = document.getElementById('manual-date-input');
    const dateStr = dateInput.value;
    const shifts = [];
    
    manualDailyRows.forEach(rowId => {
        const userSelect = document.querySelector(`.user-select-daily[data-row="${rowId}"]`);
        const startSelect = document.querySelector(`.start-time-daily[data-row="${rowId}"]`);
        const endSelect = document.querySelector(`.end-time-daily[data-row="${rowId}"]`);
        
        if (userSelect && userSelect.value) {
            shifts.push({
                user_id: parseInt(userSelect.value),
                shift_date: dateStr,
                start_time: startSelect.value,
                end_time: endSelect.value
            });
        }
    });
    
    if (shifts.length === 0) {
        alert('少なくとも1人のスタッフを追加してください');
        return;
    }
    
    const messageDiv = document.getElementById('manual-daily-message');
    
    try {
        const response = await fetch('api/admin.php?action=create_final_shifts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shifts: shifts })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, data.message, 'success');
            manualDailyRows = [];
            initManualDailyCreation();
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageDiv, '通信エラーが発生しました', 'error');
    }
}
