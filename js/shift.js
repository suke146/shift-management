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

// 15分刻みの時刻オプションを生成
function generateTimeOptions() {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = String(h).padStart(2, '0');
            const min = String(m).padStart(2, '0');
            options.push(`${hour}:${min}`);
        }
    }
    return options;
}

// 時刻選択のセレクトボックスを生成
function createTimeSelect(defaultValue = '09:00') {
    const options = generateTimeOptions();
    let html = '<select class="time-select">';
    options.forEach(time => {
        const selected = time === defaultValue ? 'selected' : '';
        html += `<option value="${time}" ${selected}>${time}</option>`;
    });
    html += '</select>';
    return html;
}

// シフト提出の初期化
function initShiftSubmit() {
    const periodInput = document.getElementById('shift-week');
    const container = document.getElementById('shift-days-container');
    
    // 現在の半月期間をデフォルトに設定
    const periodStart = getPeriodStart(new Date());
    periodInput.value = formatDate(periodStart);
    
    // 日付ごとの入力欄を生成
    generateShiftDays(container, periodStart);
    
    // 期間変更時のイベント
    periodInput.addEventListener('change', function() {
        const newPeriod = getPeriodStart(new Date(this.value));
        generateShiftDays(container, newPeriod);
    });
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
                    <div class="time-select-container" data-index="${index}" data-type="start">
                        ${createTimeSelect('09:00')}
                    </div>
                </div>
                <div class="form-group">
                    <label>終了時刻</label>
                    <div class="time-select-container" data-index="${index}" data-type="end">
                        ${createTimeSelect('18:00')}
                    </div>
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
    
    const periodInput = document.getElementById('shift-week').value;
    const messageDiv = document.getElementById('submit-message');
    
    // 半月期間の開始日
    const periodStart = formatDate(getPeriodStart(new Date(periodInput)));
    const dates = getPeriodDates(new Date(periodStart));
    
    // シフトデータを収集
    const shifts = [];
    dates.forEach((date, index) => {
        const checkbox = document.querySelector(`.availability-check[data-index="${index}"]`);
        const startSelect = document.querySelector(`.time-select-container[data-index="${index}"][data-type="start"] select`);
        const endSelect = document.querySelector(`.time-select-container[data-index="${index}"][data-type="end"] select`);
        
        shifts.push({
            shift_date: formatDate(date),
            is_available: checkbox.checked,
            start_time: checkbox.checked ? startSelect.value : null,
            end_time: checkbox.checked ? endSelect.value : null
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
