// タブ切り替え
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // メッセージをクリア
    document.getElementById('login-message').classList.remove('show');
    document.getElementById('register-message').classList.remove('show');
}

// ログイン処理
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('login-message');
    
    try {
        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, data.message, 'success');
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageDiv, '通信エラーが発生しました', 'error');
    }
}

// 新規登録処理
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const messageDiv = document.getElementById('register-message');
    
    if (password !== passwordConfirm) {
        showMessage(messageDiv, 'パスワードが一致しません', 'error');
        return;
    }
    
    try {
        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'register',
                name: name,
                email: email,
                password: password,
                password_confirm: passwordConfirm
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, data.message, 'success');
            // フォームをリセット
            document.getElementById('registerForm').reset();
            // 2秒後にログインタブに切り替え
            setTimeout(() => {
                document.querySelector('.tab-button').click();
            }, 2000);
        } else {
            showMessage(messageDiv, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageDiv, '通信エラーが発生しました', 'error');
    }
}

// メッセージ表示
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message show ${type}`;
}
