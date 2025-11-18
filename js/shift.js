// --- シフト希望一覧（全員分）表示用 ---
let currentAllPeriod = getPeriodStart(new Date());

function updateAllPeriodDisplay() {
    const display = document.getElementById('all-week-display');
    const endDate = getPeriodEnd(currentAllPeriod);
    display.textContent = `${formatDate(currentAllPeriod)} 〜 ${formatDate(endDate)}`;
}

function changeAllWeek(offset) {
    if (offset > 0) {
        const day = currentAllPeriod.getDate();
        if (day === 1) {
            currentAllPeriod.setDate(16);
        } else {
            currentAllPeriod.setMonth(currentAllPeriod.getMonth() + 1);
            currentAllPeriod.setDate(1);
        }
    } else {
        const day = currentAllPeriod.getDate();
        if (day === 16) {
            currentAllPeriod.setDate(1);
        } else {
            currentAllPeriod.setMonth(currentAllPeriod.getMonth() - 1);
            currentAllPeriod.setDate(16);
        }
    }
    updateAllPeriodDisplay();
    loadAllShiftSubmissions();
}

async function loadAllShiftSubmissions() {
    const container = document.getElementById('all-shifts-container');
    const periodStart = formatDate(currentAllPeriod);
    try {
        const response = await fetch(`api/shift.php?action=get_all_submissions&period_start=${periodStart}`);
        const data = await response.json();
        if (data.success) {
            displayAllShiftSubmissions(container, data.submissions, new Date(periodStart));
        } else {
            container.innerHTML = '<p>シフト提出の読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
    }
}

function displayAllShiftSubmissions(container, submissions, periodStart) {
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
    // テーブル生成
    let html = '<div class="table-container"><table><thead><tr>';
    html += '<th>名前</th>';
    dates.forEach(date => {
        const dayOfWeek = date.getDay();
        html += `<th>${dayNames[dayOfWeek]}<br>${formatDate(date).substring(5)}</th>`;
    });
    html += '</tr></thead><tbody>';
    for (const [userName, userData] of Object.entries(submissionsByUser)) {
        html += `<tr><td><strong>${userName}</strong></td>`;
        dates.forEach(date => {
            const dateStr = formatDate(date);
            const day = userData.dates[dateStr];
            html += '<td>';
            if (day && day.is_available) {
                html += `<div class="shift-submission">${day.start_time ? day.start_time.substring(0, 5) : '--:--'} - ${day.end_time ? day.end_time.substring(0, 5) : '--:--'}</div>`;
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

// ページ切り替え時の初期化
document.addEventListener('DOMContentLoaded', () => {
    const allPage = document.getElementById('shift-all-page');
    if (allPage) {
        // ページが表示されたら初期化
        allPage.addEventListener('show', () => {
            updateAllPeriodDisplay();
            loadAllShiftSubmissions();
        });
    }
});
let currentPeriod = getPeriodStart(new Date());
let currentManagePeriod = getPeriodStart(new Date());

// 半月期間の開始日を取得（1日または16日）
function getPeriodStart(date) {
    const d = new Date(date);
    const day = d.getDate();
    
    if (day >= 16) {
        d.setDate(16);
    } else {
        d.setDate(1);
    }
    
    return d;
}

// 半月期間の終了日を取得
function getPeriodEnd(periodStart) {
    const d = new Date(periodStart);
    const day = d.getDate();
    
    if (day === 1) {
        d.setDate(15);
    } else {
        // 月末を取得
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
    }
    
    return d;
}

// 半月期間の日付配列を取得
function getPeriodDates(periodStart) {
    const dates = [];
    const start = new Date(periodStart);
    const end = getPeriodEnd(periodStart);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }
    
    return dates;
}

// 日付をフォーマット
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 曜日名
const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

// input type="time"を使うことでスマホのUIを最適化


// シフト提出用 期間表示・切替
let currentSubmitPeriod = getPeriodStart(new Date());

function updateSubmitPeriodDisplay() {
    const display = document.getElementById('submit-week-display');
    if (display) {
        const endDate = getPeriodEnd(currentSubmitPeriod);
        display.textContent = `${formatDate(currentSubmitPeriod)} 〜 ${formatDate(endDate)}`;
    }
}

function changeSubmitWeek(offset) {
    if (offset > 0) {
        const day = currentSubmitPeriod.getDate();
        if (day === 1) {
            currentSubmitPeriod.setDate(16);
        } else {
            currentSubmitPeriod.setMonth(currentSubmitPeriod.getMonth() + 1);
            currentSubmitPeriod.setDate(1);
        }
    } else {
        const day = currentSubmitPeriod.getDate();
        if (day === 16) {
            currentSubmitPeriod.setDate(1);
        } else {
            currentSubmitPeriod.setMonth(currentSubmitPeriod.getMonth() - 1);
            currentSubmitPeriod.setDate(16);
        }
    }
    updateSubmitPeriodDisplay();
    const container = document.getElementById('shift-days-container');
    generateShiftDays(container, currentSubmitPeriod);
}

async function initShiftSubmit() {
    currentSubmitPeriod = getPeriodStart(new Date());
    updateSubmitPeriodDisplay();
    const container = document.getElementById('shift-days-container');
    // まず空欄で生成
    generateShiftDays(container, currentSubmitPeriod);
    // 既存提出内容があれば取得して反映
    const periodStart = formatDate(currentSubmitPeriod);
    try {
        const res = await fetch(`api/shift.php?action=get_my_submissions&period_start=${periodStart}`);
        const data = await res.json();
        if (data.success && data.shifts && data.shifts.length > 0) {
            // 日付ごとに反映
            data.shifts.forEach((shift, idx) => {
                const checkbox = document.querySelector(`.availability-check[data-index="${idx}"]`);
                const startTime = document.querySelector(`.start-time[data-index="${idx}"]`);
                const endTime = document.querySelector(`.end-time[data-index="${idx}"]`);
                if (checkbox) checkbox.checked = !!shift.is_available;
                if (startTime) startTime.value = shift.start_time || '09:00';
                if (endTime) endTime.value = shift.end_time || '18:00';
            });
            // 備考（note）がAPIで取得できる場合は反映（要API拡張）
            if (data.note !== undefined && document.getElementById('shift-note')) {
                document.getElementById('shift-note').value = data.note;
            }
        }
    } catch (e) {
        // 取得失敗時は何もしない
    }
}

// シフト日の入力欄を生成（半月分）
function generateShiftDays(container, periodStart) {
    container.innerHTML = '';
    const dates = getPeriodDates(periodStart);
    
    dates.forEach((date, index) => {
        const dayOfWeek = date.getDay();
        const dayDiv = document.createElement('div');
        dayDiv.className = 'shift-day';
        dayDiv.innerHTML = `
            <div class="shift-day-header">
                <label>
                    <input type="checkbox" class="availability-check" data-index="${index}" checked>
                    ${formatDate(date)} (${dayNames[dayOfWeek]})
                </label>
            </div>
            <div class="shift-day-times" id="times-${index}">
                <div class="form-group">
                    <label>開始時刻</label>
                    <input type="time" class="start-time" data-index="${index}" value="09:00" step="900">
                </div>
                <div class="form-group">
                    <label>終了時刻</label>
                    <input type="time" class="end-time" data-index="${index}" value="18:00" step="900">
                </div>
            </div>
        `;
        container.appendChild(dayDiv);
        // チェックボックスのイベント
        const checkbox = dayDiv.querySelector('.availability-check');
        const timesDiv = dayDiv.querySelector('.shift-day-times');
        checkbox.addEventListener('change', function() {
            timesDiv.style.display = this.checked ? 'grid' : 'none';
        });
    });
}

// シフト提出
async function submitShift(event) {
    event.preventDefault();
    
    const messageDiv = document.getElementById('submit-message');
    // 半月期間の開始日
    const periodStart = formatDate(currentSubmitPeriod);
    const dates = getPeriodDates(currentSubmitPeriod);
    // 備考
    const note = document.getElementById('shift-note')?.value || '';
    // シフトデータを収集
    const shifts = [];
    dates.forEach((date, index) => {
        const checkbox = document.querySelector(`.availability-check[data-index="${index}"]`);
        const startTime = document.querySelector(`.start-time[data-index="${index}"]`);
        const endTime = document.querySelector(`.end-time[data-index="${index}"]`);
        shifts.push({
            shift_date: formatDate(date),
            is_available: checkbox.checked,
            start_time: checkbox.checked ? startTime.value : null,
            end_time: checkbox.checked ? endTime.value : null
        });
    });
    try {
        const response = await fetch('api/shift.php?action=submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                period_start: periodStart,
                shifts: shifts,
                note: note
            })
        });
        const data = await response.json();
        if (data.success) {
            showMessage(messageDiv, data.message, 'success');
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageDiv, '通信エラーが発生しました', 'error');
    }
}

// シフト閲覧の初期化
function initShiftView() {
    updatePeriodDisplay();
    loadFinalShifts();
}

// 半月期間の表示を更新
function updatePeriodDisplay() {
    const display = document.getElementById('current-week-display');
    const endDate = getPeriodEnd(currentPeriod);
    
    display.textContent = `${formatDate(currentPeriod)} 〜 ${formatDate(endDate)}`;
}

// 期間を変更（半月単位）
function changeWeek(offset) {
    if (offset > 0) {
        // 次の半月
        const day = currentPeriod.getDate();
        if (day === 1) {
            currentPeriod.setDate(16);
        } else {
            currentPeriod.setMonth(currentPeriod.getMonth() + 1);
            currentPeriod.setDate(1);
        }
    } else {
        // 前の半月
        const day = currentPeriod.getDate();
        if (day === 16) {
            currentPeriod.setDate(1);
        } else {
            currentPeriod.setMonth(currentPeriod.getMonth() - 1);
            currentPeriod.setDate(16);
        }
    }
    
    updatePeriodDisplay();
    loadFinalShifts();
}

// 確定シフトを読み込み
async function loadFinalShifts() {
    const container = document.getElementById('shift-table-container');
    const periodStart = formatDate(currentPeriod);
    
    try {
        const response = await fetch(`api/shift.php?action=get_final_shifts&period_start=${periodStart}`);
        const data = await response.json();
        
        if (data.success) {
            displayShiftTable(container, data.shifts, new Date(periodStart));
        } else {
            container.innerHTML = '<p>シフトの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
    }
}

// シフト表を表示
function displayShiftTable(container, shifts, periodStart) {
    if (shifts.length === 0) {
        container.innerHTML = '<p>この期間のシフトはまだ作成されていません</p>';
        return;
    }
    
    const dates = getPeriodDates(periodStart);
    
    // 日付ごとにグループ化
    const shiftsByDate = {};
    shifts.forEach(shift => {
        if (!shiftsByDate[shift.shift_date]) {
            shiftsByDate[shift.shift_date] = [];
        }
        shiftsByDate[shift.shift_date].push(shift);
    });
    
    // テーブルを生成
    let html = '<table><thead><tr>';
    
    // ヘッダー(日付と曜日)
    dates.forEach(date => {
        const dayOfWeek = date.getDay();
        html += `<th>${dayNames[dayOfWeek]}<br>${formatDate(date).substring(5)}</th>`;
    });
    html += '</tr></thead><tbody><tr>';
    
    // 各日のシフト
    dates.forEach(date => {
        const dateStr = formatDate(date);
        
        html += '<td class="shift-cell">';
        if (shiftsByDate[dateStr]) {
            shiftsByDate[dateStr].forEach(shift => {
                const isMyShift = shift.user_id == userId;
                const shiftClass = isMyShift ? 'shift-item my-shift' : 'shift-item';
                html += `<div class="${shiftClass}">
                    ${shift.user_name}<br>
                    ${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}
                </div>`;
            });
        }
        html += '</td>';
    });
    
    html += '</tr></tbody></table>';
    container.innerHTML = html;
}

// メッセージ表示
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message show ${type}`;
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}
