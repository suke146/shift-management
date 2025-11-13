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

// 週の開始日（月曜日）を取得
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日に調整
    d.setDate(diff);
    return d;
}

// 週の終了日（日曜日）を取得
function getWeekEnd(weekStart) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
}

// 週の日付配列を取得
function getWeekDates(weekStart) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        dates.push(d);
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

// シフト表を表示（ガントチャート形式）
function displayShiftTable(container, shifts, periodStart, isWeekly = false) {
    if (shifts.length === 0) {
        container.innerHTML = '<p class="no-shift-message">この期間のシフトはまだ作成されていません</p>';
        return;
    }
    
    const dates = isWeekly ? getWeekDates(periodStart) : getPeriodDates(periodStart);
    
    // 全ユーザーを取得（シフトがあるユーザーのみ）
    const userShifts = {};
    
    shifts.forEach(shift => {
        if (!userShifts[shift.user_id]) {
            userShifts[shift.user_id] = {
                user_name: shift.user_name,
                shifts: []
            };
        }
        userShifts[shift.user_id].shifts.push(shift);
    });
    
    // 月と期間を表示
    const month = periodStart.getMonth() + 1;
    const year = periodStart.getFullYear();
    const title = isWeekly ? '週間シフト表' : 'シフト表';
    
    let html = '<div class="gantt-wrapper">';
    html += `<div class="shift-period-header">${year}年 ${month}月 ${title}</div>`;
    html += '<div class="gantt-container">';
    
    // ヘッダー
    html += '<div class="gantt-header">';
    html += '<div class="gantt-name-header">名前</div>';
    html += '<div class="gantt-timeline-header">';
    dates.forEach(date => {
        const day = date.getDate();
        const dayOfWeek = date.getDay();
        const dayClass = dayOfWeek === 0 ? 'sunday' : (dayOfWeek === 6 ? 'saturday' : '');
        html += `<div class="gantt-date-header ${dayClass}">
            <div class="date-number">${day}</div>
            <div class="day-name">${dayNames[dayOfWeek]}</div>
        </div>`;
    });
    html += '</div></div>';
    
    // 各ユーザーの行
    html += '<div class="gantt-body">';
    for (const userId in userShifts) {
        const userData = userShifts[userId];
        const isMyRow = userId == window.userId;
        
        html += `<div class="gantt-row ${isMyRow ? 'my-row' : ''}">`;
        html += `<div class="gantt-name-cell"><strong>${userData.user_name}</strong></div>`;
        html += '<div class="gantt-timeline">';
        
        // グリッド線
        dates.forEach((date, index) => {
            const dayOfWeek = date.getDay();
            const dayClass = dayOfWeek === 0 ? 'sunday' : (dayOfWeek === 6 ? 'saturday' : '');
            html += `<div class="gantt-grid-cell ${dayClass}"></div>`;
        });
        
        // シフトバー
        userData.shifts.forEach(shift => {
            const shiftDate = new Date(shift.shift_date);
            const dayIndex = dates.findIndex(d => formatDate(d) === shift.shift_date);
            
            if (dayIndex !== -1) {
                const startTime = shift.start_time.substring(0, 5);
                const endTime = shift.end_time.substring(0, 5);
                
                html += `<div class="gantt-bar" style="left: ${dayIndex * 100 / dates.length}%; width: ${100 / dates.length}%;" title="${startTime} - ${endTime}">
                    <span class="bar-label">${startTime} - ${endTime}</span>
                </div>`;
            }
        });
        
        html += '</div></div>';
    }
    html += '</div>';
    
    html += '</div></div>';
    container.innerHTML = html;
}

// 希望シフト閲覧用の期間管理
let currentRequestPeriod = getPeriodStart(new Date());

// 希望シフト一覧の期間表示を更新
function updateRequestPeriodDisplay() {
    const display = document.getElementById('request-week-display2');
    const endDate = getPeriodEnd(currentRequestPeriod);
    
    display.textContent = `${formatDate(currentRequestPeriod)} 〜 ${formatDate(endDate)}`;
}

// 希望シフト一覧の期間を変更
function changeRequestWeek(offset) {
    if (offset > 0) {
        const day = currentRequestPeriod.getDate();
        if (day === 1) {
            currentRequestPeriod.setDate(16);
        } else {
            currentRequestPeriod.setMonth(currentRequestPeriod.getMonth() + 1);
            currentRequestPeriod.setDate(1);
        }
    } else {
        const day = currentRequestPeriod.getDate();
        if (day === 16) {
            currentRequestPeriod.setDate(1);
        } else {
            currentRequestPeriod.setMonth(currentRequestPeriod.getMonth() - 1);
            currentRequestPeriod.setDate(16);
        }
    }
    
    updateRequestPeriodDisplay();
    loadRequestShifts();
}

// 希望シフト一覧を読み込み
async function loadRequestShifts() {
    const container = document.getElementById('request-table-container');
    const periodStart = formatDate(currentRequestPeriod);
    
    updateRequestPeriodDisplay();
    
    try {
        const response = await fetch(`api/shift.php?action=get_all_requests&period_start=${periodStart}`);
        const data = await response.json();
        
        if (data.success) {
            displayRequestTable(container, data.submissions, new Date(periodStart));
        } else {
            container.innerHTML = '<p>希望シフトの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>通信エラーが発生しました</p>';
    }
}

// 希望シフト表を表示（ガントチャート形式）
function displayRequestTable(container, submissions, periodStart) {
    if (submissions.length === 0) {
        container.innerHTML = '<p class="no-shift-message">この期間の希望シフトはまだ提出されていません</p>';
        return;
    }
    
    const dates = getPeriodDates(periodStart);
    
    // ユーザーごとにグループ化
    const userShifts = {};
    submissions.forEach(sub => {
        if (!userShifts[sub.user_id]) {
            userShifts[sub.user_id] = {
                user_name: sub.user_name,
                shifts: []
            };
        }
        if (sub.is_available && sub.start_time && sub.end_time) {
            userShifts[sub.user_id].shifts.push(sub);
        }
    });
    
    // 月と期間を表示
    const month = periodStart.getMonth() + 1;
    const year = periodStart.getFullYear();
    
    let html = '<div class="gantt-wrapper">';
    html += `<div class="shift-period-header">${year}年 ${month}月 希望シフト一覧</div>`;
    html += '<div class="gantt-container">';
    
    // ヘッダー
    html += '<div class="gantt-header">';
    html += '<div class="gantt-name-header">名前</div>';
    html += '<div class="gantt-timeline-header">';
    dates.forEach(date => {
        const day = date.getDate();
        const dayOfWeek = date.getDay();
        const dayClass = dayOfWeek === 0 ? 'sunday' : (dayOfWeek === 6 ? 'saturday' : '');
        html += `<div class="gantt-date-header ${dayClass}">
            <div class="date-number">${day}</div>
            <div class="day-name">${dayNames[dayOfWeek]}</div>
        </div>`;
    });
    html += '</div></div>';
    
    // 各ユーザーの行
    html += '<div class="gantt-body">';
    for (const userId in userShifts) {
        const userData = userShifts[userId];
        
        html += `<div class="gantt-row">`;
        html += `<div class="gantt-name-cell"><strong>${userData.user_name}</strong></div>`;
        html += '<div class="gantt-timeline">';
        
        // グリッド線
        dates.forEach((date, index) => {
            const dayOfWeek = date.getDay();
            const dayClass = dayOfWeek === 0 ? 'sunday' : (dayOfWeek === 6 ? 'saturday' : '');
            html += `<div class="gantt-grid-cell ${dayClass}"></div>`;
        });
        
        // シフトバー（希望シフト用）
        userData.shifts.forEach(shift => {
            const dayIndex = dates.findIndex(d => formatDate(d) === shift.shift_date);
            
            if (dayIndex !== -1) {
                const startTime = shift.start_time ? shift.start_time.substring(0, 5) : '--:--';
                const endTime = shift.end_time ? shift.end_time.substring(0, 5) : '--:--';
                
                html += `<div class="gantt-bar request-bar" style="left: ${dayIndex * 100 / dates.length}%; width: ${100 / dates.length}%;" title="${startTime} - ${endTime}">
                    <span class="bar-label">${startTime} - ${endTime}</span>
                </div>`;
            }
        });
        
        html += '</div></div>';
    }
    html += '</div>';
    
    html += '</div></div>';
    container.innerHTML = html;
}

// === 確定シフト閲覧の表示モード切り替え ===
let currentFinalDay = new Date();
let currentFinalWeek = getWeekStart(new Date());

function switchFinalViewMode(mode) {
    // すべての表示モードを非表示
    document.getElementById('final-daily-view').classList.remove('active');
    document.getElementById('final-weekly-view').classList.remove('active');
    document.getElementById('final-half-month-view').classList.remove('active');
    
    if (mode === 'daily') {
        document.getElementById('final-daily-view').classList.add('active');
        initFinalDayView();
    } else if (mode === 'weekly') {
        document.getElementById('final-weekly-view').classList.add('active');
        initFinalWeekView();
    } else {
        document.getElementById('final-half-month-view').classList.add('active');
        loadFinalShifts();
    }
}

function initFinalDayView() {
    currentFinalDay = new Date();
    document.getElementById('final-date-input').value = formatDate(currentFinalDay);
    loadFinalDayShift();
}

function changeFinalDay(offset) {
    currentFinalDay.setDate(currentFinalDay.getDate() + offset);
    document.getElementById('final-date-input').value = formatDate(currentFinalDay);
    loadFinalDayShift();
}

async function loadFinalDayShift() {
    const dateInput = document.getElementById('final-date-input');
    currentFinalDay = new Date(dateInput.value);
    const container = document.getElementById('final-daily-container');
    const dateStr = formatDate(currentFinalDay);
    
    try {
        const response = await fetch(`api/shift.php?action=get_final_shifts_by_date&date=${dateStr}`);
        const data = await response.json();
        
        if (data.success) {
            displayDayShiftTable(container, data.shifts, currentFinalDay, '確定シフト');
        } else {
            container.innerHTML = '<p class="no-shift-message">データの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="no-shift-message">通信エラーが発生しました</p>';
    }
}

function initFinalWeekView() {
    currentFinalWeek = getWeekStart(new Date());
    updateFinalWeekDisplay();
    loadFinalWeekShift();
}

function updateFinalWeekDisplay() {
    const display = document.getElementById('final-week-display');
    const weekEnd = getWeekEnd(currentFinalWeek);
    display.textContent = `${formatDate(currentFinalWeek)} 〜 ${formatDate(weekEnd)}`;
}

function changeFinalWeek(offset) {
    currentFinalWeek.setDate(currentFinalWeek.getDate() + (offset * 7));
    updateFinalWeekDisplay();
    loadFinalWeekShift();
}

async function loadFinalWeekShift() {
    const container = document.getElementById('final-weekly-container');
    const weekStart = formatDate(currentFinalWeek);
    const weekEnd = formatDate(getWeekEnd(currentFinalWeek));
    
    try {
        const response = await fetch(`api/shift.php?action=get_final_shifts_range&start_date=${weekStart}&end_date=${weekEnd}`);
        const data = await response.json();
        
        if (data.success) {
            displayShiftTable(container, data.shifts, currentFinalWeek, true);
        } else {
            container.innerHTML = '<p class="no-shift-message">データの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="no-shift-message">通信エラーが発生しました</p>';
    }
}

// === 希望シフト閲覧の表示モード切り替え ===
let currentRequestDay = new Date();
let currentRequestWeekly = getWeekStart(new Date());

function switchRequestViewMode(mode) {
    document.getElementById('request-daily-view').classList.remove('active');
    document.getElementById('request-weekly-view').classList.remove('active');
    document.getElementById('request-half-month-view').classList.remove('active');
    
    if (mode === 'daily') {
        document.getElementById('request-daily-view').classList.add('active');
        initRequestDayView();
    } else if (mode === 'weekly') {
        document.getElementById('request-weekly-view').classList.add('active');
        initRequestWeekView();
    } else {
        document.getElementById('request-half-month-view').classList.add('active');
        loadRequestShifts();
    }
}

function initRequestDayView() {
    currentRequestDay = new Date();
    document.getElementById('request-date-input').value = formatDate(currentRequestDay);
    loadRequestDayShift();
}

function changeRequestDay(offset) {
    currentRequestDay.setDate(currentRequestDay.getDate() + offset);
    document.getElementById('request-date-input').value = formatDate(currentRequestDay);
    loadRequestDayShift();
}

async function loadRequestDayShift() {
    const dateInput = document.getElementById('request-date-input');
    currentRequestDay = new Date(dateInput.value);
    const container = document.getElementById('request-daily-container');
    const dateStr = formatDate(currentRequestDay);
    
    try {
        const response = await fetch(`api/shift.php?action=get_requests_by_date&date=${dateStr}`);
        const data = await response.json();
        
        if (data.success) {
            displayDayShiftTable(container, data.submissions, currentRequestDay, '希望シフト');
        } else {
            container.innerHTML = '<p class="no-shift-message">データの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="no-shift-message">通信エラーが発生しました</p>';
    }
}

function initRequestWeekView() {
    currentRequestWeekly = getWeekStart(new Date());
    updateRequestWeekDisplay();
    loadRequestWeekShift();
}

function updateRequestWeekDisplay() {
    const display = document.getElementById('request-week-display');
    const weekEnd = getWeekEnd(currentRequestWeekly);
    display.textContent = `${formatDate(currentRequestWeekly)} 〜 ${formatDate(weekEnd)}`;
}

function changeRequestWeekly(offset) {
    currentRequestWeekly.setDate(currentRequestWeekly.getDate() + (offset * 7));
    updateRequestWeekDisplay();
    loadRequestWeekShift();
}

async function loadRequestWeekShift() {
    const container = document.getElementById('request-weekly-container');
    const weekStart = formatDate(currentRequestWeekly);
    const weekEnd = formatDate(getWeekEnd(currentRequestWeekly));
    
    try {
        const response = await fetch(`api/shift.php?action=get_requests_range&start_date=${weekStart}&end_date=${weekEnd}`);
        const data = await response.json();
        
        if (data.success) {
            displayRequestWeekTable(container, data.submissions, currentRequestWeekly);
        } else {
            container.innerHTML = '<p class="no-shift-message">データの読み込みに失敗しました</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="no-shift-message">通信エラーが発生しました</p>';
    }
}

// 1日分のシフト表示
function displayDayShiftTable(container, data, date, title) {
    const dayOfWeek = date.getDay();
    const dateStr = formatDate(date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let html = '<div class="shift-table-wrapper">';
    html += `<div class="shift-period-header">${year}年${month}月${day}日（${dayNames[dayOfWeek]}）${title}</div>`;
    html += '<table class="shift-schedule-table single-day"><thead><tr>';
    html += '<th class="name-column">名前</th>';
    html += '<th class="time-column">シフト時間</th>';
    html += '</tr></thead><tbody>';
    
    if (data.length === 0) {
        html += '<tr><td colspan="2" class="no-shift-message">この日のシフトはありません</td></tr>';
    } else {
        data.forEach(shift => {
            const isMyShift = shift.user_id == userId;
            html += `<tr class="${isMyShift ? 'my-row' : ''}">`;
            html += `<td class="name-cell"><strong>${shift.user_name}</strong></td>`;
            
            if (shift.is_available !== undefined && !shift.is_available) {
                html += '<td class="time-cell"><div class="no-shift">勤務不可</div></td>';
            } else if (shift.start_time && shift.end_time) {
                html += `<td class="time-cell">
                    <div class="shift-time">
                        <div class="start-time">${shift.start_time.substring(0, 5)}</div>
                        <div class="end-time">${shift.end_time.substring(0, 5)}</div>
                    </div>
                </td>`;
            } else {
                html += '<td class="time-cell"><div class="no-shift">-</div></td>';
            }
            html += '</tr>';
        });
    }
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// 希望シフトの週間表示
function displayRequestWeekTable(container, submissions, weekStart) {
    if (submissions.length === 0) {
        container.innerHTML = '<p class="no-shift-message">この期間の希望シフトはまだ提出されていません</p>';
        return;
    }
    
    const dates = getWeekDates(weekStart);
    
    // ユーザーごとにグループ化
    const userShifts = {};
    submissions.forEach(sub => {
        if (!userShifts[sub.user_id]) {
            userShifts[sub.user_id] = {
                user_name: sub.user_name,
                dates: {}
            };
        }
        userShifts[sub.user_id].dates[sub.shift_date] = sub;
    });
    
    const year = weekStart.getFullYear();
    const month = weekStart.getMonth() + 1;
    
    let html = '<div class="shift-table-wrapper">';
    html += `<div class="shift-period-header">${year}年${month}月 週間希望シフト</div>`;
    html += '<table class="shift-schedule-table"><thead><tr>';
    html += '<th class="name-column">名前</th>';
    
    dates.forEach(date => {
        const day = date.getDate();
        const dayOfWeek = date.getDay();
        const dayClass = dayOfWeek === 0 ? 'sunday' : (dayOfWeek === 6 ? 'saturday' : '');
        html += `<th class="date-column ${dayClass}">
            <div class="date-number">${day}</div>
            <div class="day-name">${dayNames[dayOfWeek]}</div>
        </th>`;
    });
    html += '</tr></thead><tbody>';
    
    for (const userId in userShifts) {
        const userData = userShifts[userId];
        html += `<tr>`;
        html += `<td class="name-cell"><strong>${userData.user_name}</strong></td>`;
        
        dates.forEach(date => {
            const dateStr = formatDate(date);
            const day = userData.dates[dateStr];
            const dayOfWeek = date.getDay();
            const dayClass = dayOfWeek === 0 ? 'sunday' : (dayOfWeek === 6 ? 'saturday' : '');
            
            html += `<td class="time-cell ${dayClass}">`;
            if (day && day.is_available) {
                html += `<div class="shift-time request-shift">
                    <div class="start-time">${day.start_time ? day.start_time.substring(0, 5) : '--:--'}</div>
                    <div class="end-time">${day.end_time ? day.end_time.substring(0, 5) : '--:--'}</div>
                </div>`;
            } else {
                html += '<div class="no-shift">×</div>';
            }
            html += '</td>';
        });
        
        html += '</tr>';
    }
    
    html += '</tbody></table></div>';
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
