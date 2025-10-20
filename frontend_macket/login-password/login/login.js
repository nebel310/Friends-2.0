// Функция для показа уведомлений (можно вынести в отдельный файл)
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
        error: '❌'
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
        const response = await fetch('http://185.31.165.210:3001/api/auth/login', {
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
            localStorage.setItem('token', result.token);
            showToast("Вход выполнен успешно!", "success");
            
            // Переход в дашборд
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showToast(`Ошибка: ${result.message || 'Неверные данные'}`, "error");
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        showToast('Ошибка сети. Проверьте подключение к интернету.', "error");
    }
});