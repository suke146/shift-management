let currentWeek = getMonday(new Date());
let currentManageWeek = getMonday(new Date());

// 月曜日を取得
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// 日付をフォーマット
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 曜日名
const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

// シフト提出の初期化
function initShiftSubmit() {
    const weekInput = document.getElementById('shift-week');
    const container = document.getElementById('shift-days-container');
    
    // 今週をデフォルトに設定
    const monday = getMonday(new Date());
    weekInput.value = formatDate(monday).substring(0, 8);
    
    // 曜日ごとの入力欄を生成
    generateShiftDays(container, monday);
}

// シフト日の入力欄を生成
function generateShiftDays(container, startDate) {
    container.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'shift-day';
        dayDiv.innerHTML = `
            <div class="shift-day-header">
                <label>
                    <input type="checkbox" class="availability-check" data-day="${i}" checked>
                    ${dayNames[i]}曜日 (${formatDate(date)})
                </label>
            </div>
            <div class="shift-day-times" id="times-${i}">
                <div class="form-group">
                    <label>開始時刻</label>
                    <input type="time" class="start-time" data-day="${i}" value="09:00">
                </div>
                <div class="form-group">
                    <label>終了時刻</label>
                    <input type="time" class="end-time" data-day="${i}" value="18:00">
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
    }
}

// シフト提出
async function submitShift(event) {
    event.preventDefault();
    
    const weekInput = document.getElementById('shift-week').value;
    const messageDiv = document.getElementById('submit-message');
    
    // 週の月曜日を計算
    const weekStart = formatDate(getMonday(new Date(weekInput + '-01')));
    
    // シフトデータを収集
    const shifts = [];
    for (let i = 0; i < 7; i++) {
        const checkbox = document.querySelector(`.availability-check[data-day="${i}"]`);
        const startTime = document.querySelector(`.start-time[data-day="${i}"]`);
        const endTime = document.querySelector(`.end-time[data-day="${i}"]`);
        
        shifts.push({
            day_of_week: i,
            is_available: checkbox.checked,
            start_time: checkbox.checked ? startTime.value : null,
            end_time: checkbox.checked ? endTime.value : null
        });
    }
    
    try {
        const response = await fetch('api/shift.php?action=submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                week_start: weekStart,
                shifts: shifts
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
    updateWeekDisplay();
    loadFinalShifts();
}

// 週の表示を更新
function updateWeekDisplay() {
    const display = document.getElementById('current-week-display');
    const endDate = new Date(currentWeek);
    endDate.setDate(endDate.getDate() + 6);
    
    display.textContent = `${formatDate(currentWeek)} 〜 ${formatDate(endDate)}`;
}

// 週を変更
function changeWeek(offset) {
    currentWeek.setDate(currentWeek.getDate() + (offset * 7));
    updateWeekDisplay();
    loadFinalShifts();
}

// 確定シフトを読み込み
async function loadFinalShifts() {
    const container = document.getElementById('shift-table-container');
    const weekStart = formatDate(currentWeek);
    
    try {
        const response = await fetch(`api/shift.php?action=get_final_shifts&week_start=${weekStart}`);
        const data = await response.json();
        
        if (data.success) {
            displayShiftTable(container, data.shifts, weekStart);
        } else {
            container.innerHTML = '<p>シフトの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
    }
}

// シフト表を表示
function displayShiftTable(container, shifts, weekStart) {
    if (shifts.length === 0) {
        container.innerHTML = '<p>この週のシフトはまだ作成されていません</p>';
        return;
    }
    
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
    
    // ヘッダー(曜日)
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        html += `<th>${dayNames[i]}<br>${formatDate(date).substring(5)}</th>`;
    }
    html += '</tr></thead><tbody><tr>';
    
    // 各日のシフト
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
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
    }
    
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
