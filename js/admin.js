// 管理者専用機能

// シフト管理の初期化
function initShiftManage() {
    updateManagePeriodDisplay();
    loadAllSubmissions();
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
    loadAllSubmissions();
}

// 全ユーザーのシフト提出を読み込み
async function loadAllSubmissions() {
    const container = document.getElementById('manage-shifts-container');
    const periodStart = formatDate(currentManagePeriod);
    
    try {
        const response = await fetch(`api/admin.php?action=get_all_submissions&period_start=${periodStart}`);
        const data = await response.json();
        
        if (data.success) {
            displaySubmissions(container, data.submissions, new Date(periodStart));
        } else {
            container.innerHTML = '<p>シフト提出の読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
    }
}

// シフト提出を表示
function displaySubmissions(container, submissions, periodStart) {
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
                html += `<div class="shift-submission">
                    ${day.start_time ? day.start_time.substring(0, 5) : '--:--'} - 
                    ${day.end_time ? day.end_time.substring(0, 5) : '--:--'}
                    <br>
                    <input type="checkbox" class="assign-shift" 
                        data-user-id="${userData.user_id}"
                        data-date="${dateStr}"
                        data-start="${day.start_time}"
                        data-end="${day.end_time}">
                    採用
                </div>`;
            } else {
                html += '<span style="color: #999;">×</span>';
            }
            
            html += '</td>';
        });
        
        html += '</tr>';
    }
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// 確定シフトを作成
async function createFinalShift() {
    const checkboxes = document.querySelectorAll('.assign-shift:checked');
    
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
            loadAllSubmissions(); // リロード
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageDiv, '通信エラーが発生しました', 'error');
    }
}

// ユーザー一覧を読み込み
async function loadUsers() {
    const container = document.getElementById('users-list-container');
    
    try {
        const response = await fetch('api/admin.php?action=get_users');
        const data = await response.json();
        
        if (data.success) {
            displayUsers(container, data.users);
        } else {
            container.innerHTML = '<p>ユーザーの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
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
