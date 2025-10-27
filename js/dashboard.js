// ページ切り替え
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    const menuItems = document.querySelectorAll('.menu-item');
    
    pages.forEach(page => page.classList.remove('active'));
    menuItems.forEach(item => item.classList.remove('active'));
    
    document.getElementById(`${pageName}-page`).classList.add('active');
    event.target.classList.add('active');
    
    // ページに応じた初期化処理
    if (pageName === 'shift-submit') {
        initShiftSubmit();
    } else if (pageName === 'shift-view') {
        initShiftView();
    } else if (pageName === 'shift-manage') {
        initShiftManage();
    } else if (pageName === 'user-manage') {
        loadUsers();
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initShiftSubmit();
});
