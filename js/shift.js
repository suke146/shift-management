let currentPeriod = getPeriodStart(new Date());
let currentManagePeriod = getPeriodStart(new Date());

// HTML を安全に表示するためのエスケープ（簡易）
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

// 時刻入力フィールドを生成（15分刻み）
function createTimeInput(defaultValue = '09:00') {
    return `<input type="time" class="time-input" value="${defaultValue}" step="900">`;
}

// シフト提出の初期化
async function initShiftSubmit() {
    const periodInput = document.getElementById('shift-week');
    const container = document.getElementById('shift-days-container');
    
    // 現在の半月期間をデフォルトに設定
    const periodStart = getPeriodStart(new Date());
    periodInput.value = formatDate(periodStart);
    
    // 日付ごとの入力欄を生成
    await generateShiftDays(container, periodStart);
    
    // 既存のシフトデータを読み込み
    await loadExistingShiftData(periodStart);
    
    // 期間変更時のイベント
    periodInput.addEventListener('change', async function() {
        const newPeriod = getPeriodStart(new Date(this.value));
        await generateShiftDays(container, newPeriod);
        await loadExistingShiftData(newPeriod);
    });
}

// 既存のシフトデータを読み込んで復元
async function loadExistingShiftData(periodStart) {
    const periodStartStr = formatDate(periodStart);
    
    try {
        const response = await fetch(`api/shift.php?action=get_my_submissions&period_start=${periodStartStr}`);
        const data = await response.json();
        
        if (data.success && data.shifts.length > 0) {
            data.shifts.forEach(shift => {
                const index = getPeriodDates(periodStart).findIndex(d => formatDate(d) === shift.shift_date);
                if (index >= 0) {
                    // ラジオボタンの設定
                    const radioWork = document.querySelector(`.shift-type-radio[data-index="${index}"][value="work"]`);
                    const radioOff = document.querySelector(`.shift-type-radio[data-index="${index}"][value="off"]`);
                    
                    if (shift.is_available) {
                        if (radioWork) radioWork.checked = true;
                        // 時刻を設定
                        const startInput = document.querySelector(`.time-input-container[data-index="${index}"][data-type="start"] input`);
                        const endInput = document.querySelector(`.time-input-container[data-index="${index}"][data-type="end"] input`);
                        if (startInput && shift.start_time) startInput.value = shift.start_time.substring(0, 5);
                        if (endInput && shift.end_time) endInput.value = shift.end_time.substring(0, 5);
                    } else {
                        if (radioOff) {
                            radioOff.checked = true;
                            // 時刻入力欄を非表示
                            const timesDiv = document.getElementById(`times-${index}`);
                            if (timesDiv) timesDiv.style.display = 'none';
                        }
                    }
                    
                    // メモを設定
                    const noteEl = document.querySelector(`.day-note[data-index="${index}"]`);
                    if (noteEl && shift.note) noteEl.value = shift.note;
                }
            });
        }
    } catch (error) {
        console.error('Error loading existing shift data:', error);
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
                <span class="date-label">${formatDate(date)} (${dayNames[dayOfWeek]})</span>
                <div class="shift-type-selector">
                    <label>
                        <input type="radio" name="shift-type-${index}" class="shift-type-radio" data-index="${index}" value="work" checked>
                        勤務
                    </label>
                    <label>
                        <input type="radio" name="shift-type-${index}" class="shift-type-radio" data-index="${index}" value="off">
                        休み
                    </label>
                </div>
            </div>
            <div class="shift-day-times" id="times-${index}">
                <div class="form-group">
                    <label>開始時刻</label>
                    <div class="time-input-container" data-index="${index}" data-type="start">
                        ${createTimeInput('09:00')}
                    </div>
                </div>
                <div class="form-group">
                    <label>終了時刻</label>
                    <div class="time-input-container" data-index="${index}" data-type="end">
                        ${createTimeInput('18:00')}
                    </div>
                </div>
                <div class="form-group">
                    <label>メモ（任意）</label>
                    <textarea class="day-note" data-index="${index}" placeholder="休み希望理由や備考を入力"></textarea>
                </div>
            </div>
        `;
        
        container.appendChild(dayDiv);
        
        // ラジオボタンのイベント
        const radioButtons = dayDiv.querySelectorAll('.shift-type-radio');
        const timesDiv = dayDiv.querySelector('.shift-day-times');
        
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'work') {
                    timesDiv.style.display = 'grid';
                } else {
                    timesDiv.style.display = 'none';
                }
            });
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
        const radioWork = document.querySelector(`.shift-type-radio[data-index="${index}"][value="work"]`);
        const isWork = radioWork ? radioWork.checked : false;
        const startInput = document.querySelector(`.time-input-container[data-index="${index}"][data-type="start"] input`);
        const endInput = document.querySelector(`.time-input-container[data-index="${index}"][data-type="end"] input`);
        const noteEl = document.querySelector(`.day-note[data-index="${index}"]`);
        
        shifts.push({
            shift_date: formatDate(date),
            is_available: isWork,
            start_time: isWork ? startInput.value : null,
            end_time: isWork ? endInput.value : null,
            note: noteEl ? noteEl.value : null
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
    loadAllSubmissionsPublic();
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
            container.innerHTML = `<p>シフトの読み込みに失敗しました: ${data.message || ''}</p>`;
        }
    } catch (error) {
        console.error('Error loading final shifts:', error);
        container.innerHTML = `<p>通信エラーが発生しました: ${error.message}</p>`;
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

// 全ユーザーの提出状況を読み込み（公開）
async function loadAllSubmissionsPublic() {
    const container = document.getElementById('submissions-public-container');
    const periodStart = formatDate(currentPeriod);

    try {
        const response = await fetch(`api/shift.php?action=get_all_submissions_public&period_start=${periodStart}`);
        const data = await response.json();

        if (data.success) {
            displayPublicSubmissions(container, data.submissions, new Date(periodStart));
        } else {
            container.innerHTML = `<p>提出状況の読み込みに失敗しました: ${data.message || ''}</p>`;
        }
    } catch (error) {
        console.error('Error loading submissions:', error);
        container.innerHTML = `<p>通信エラーが発生しました: ${error.message}</p>`;
    }
}

function displayPublicSubmissions(container, submissions, periodStart) {
    if (submissions.length === 0) {
        container.innerHTML = '<p>この期間の提出はありません</p>';
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
                html += `<div class="shift-submission">
                    ${day.start_time ? day.start_time.substring(0, 5) : '--:--'} - 
                    ${day.end_time ? day.end_time.substring(0, 5) : '--:--'}
                </div>`;
                if (day.note) {
                    html += `<div class="submission-note">${escapeHtml(day.note)}</div>`;
                }
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

// メッセージ表示
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message show ${type}`;
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}
