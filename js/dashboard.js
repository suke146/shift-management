// ページ切り替え
async function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    const menuItems = document.querySelectorAll('.menu-item');
    
    pages.forEach(page => page.classList.remove('active'));
    menuItems.forEach(item => item.classList.remove('active'));
    
    document.getElementById(`${pageName}-page`).classList.add('active');
    event.target.classList.add('active');
    
    // ページに応じた初期化処理
    if (pageName === 'shift-submit') {
        await initShiftSubmit();
    } else if (pageName === 'shift-view') {
        initShiftView();
    } else if (pageName === 'shift-all') {
        // シフト希望一覧ページの初期化
        if (typeof updateAllPeriodDisplay === 'function') updateAllPeriodDisplay();
        if (typeof loadAllShiftSubmissions === 'function') loadAllShiftSubmissions();
    } else if (pageName === 'shift-manage') {
        if (typeof initShiftManage === 'function') {
            await initShiftManage();
        }
    } else if (pageName === 'user-manage') {
        if (typeof loadUsers === 'function') {
            loadUsers();
        }
    }
}

// シフト閲覧タブの切り替え
function switchViewTab(tabName) {
    const tabs = document.querySelectorAll('#shift-view-page .tab-btn');
    const contents = document.querySelectorAll('#shift-view-page .tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    
    if (tabName === 'final') {
        document.getElementById('final-shift-view').classList.add('active');
        loadFinalShifts();
    } else if (tabName === 'requests') {
        document.getElementById('requests-shift-view').classList.add('active');
        loadRequestShifts();
    }
}

// 管理者シフト管理タブの切り替え
function switchManageTab(tabName) {
    const tabs = document.querySelectorAll('#shift-manage-page .tab-btn');
    const contents = document.querySelectorAll('#shift-manage-page .tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    
    if (tabName === 'requests') {
        document.getElementById('manage-requests').classList.add('active');
        loadAllSubmissions();
    } else if (tabName === 'manual') {
        document.getElementById('manage-manual').classList.add('active');
        initManualShiftCreation();
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard initialized');
    
    // 最初のページ（シフト提出）を初期化
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id;
        console.log('Active page:', pageId);
        
        if (pageId === 'shift-submit-page') {
            await initShiftSubmit();
        } else if (pageId === 'shift-view-page') {
            initShiftView();
        } else if (pageId === 'shift-manage-page' && typeof initShiftManage === 'function') {
            await initShiftManage();
        } else if (pageId === 'user-manage-page' && typeof loadUsers === 'function') {
            loadUsers();
        }
    } else {
        // デフォルト
        await initShiftSubmit();
    }
});
