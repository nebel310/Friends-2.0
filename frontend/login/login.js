// Функция для показа уведомлений
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.5s ease forwards';
    }, 10);
    
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Обработка формы логина
document.getElementById("loginForm").addEventListener("submit", async function(event){
    event.preventDefault();
    
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showToast("Заполните все поля!", "error");
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/auth/login', {  // ИСПРАВЛЕНО URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Сохраняем токен
            localStorage.setItem('token', result.access_token);  // ИСПРАВЛЕНО: было result.token
            showToast("Вход выполнен успешно!", "success");
            
            // Переход в дашборд
            setTimeout(() => {
    window.location.href = '../dashboard/index.html';
}, 1000);
        } else {
            showToast(`Ошибка: ${result.detail || 'Неверные данные'}`, "error");  // ИСПРАВЛЕНО: было result.message
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        showToast('Ошибка сети. Проверьте подключение к интернету.', "error");
    }
});