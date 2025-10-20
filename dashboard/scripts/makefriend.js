// Функция для показа уведомлений
function showToast(message, type = 'info') {
    // Создаем контейнер для уведомлений если его нет
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
    
    // Анимация появления
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Закрытие по клику
    toast.querySelector('.toast-close').addEventListener('click', function() {
        closeToast(toast);
    });
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        closeToast(toast);
    }, 5000);
    
    return toast;
}

function closeToast(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 300);
}

// Функция отправки заявки в друзья
async function sendFriendRequest(usernameOrEmail) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://185.31.165.210:3001/api/friends/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                usernameOrEmail: usernameOrEmail 
            })
        });

        const result = await response.json();

        if (response.ok) {
            showToast(`Заявка отправлена пользователю ${usernameOrEmail}`, 'success');
            return true;
        } else {
            showToast(`Ошибка: ${result.message || 'Не удалось отправить заявку'}`, 'error');
            return false;
        }
    } catch (error) {
        showToast('Ошибка сети при отправке заявки', 'error');
        return false;
    }
}

// Обработка отправки заявки в друзья
function handleFriendRequest() {
    const addFriendInput = document.querySelector('.add-friend-input');
    const addFriendBtn = document.querySelector('.add-friend-form .btn-primary');
    
    const inputValue = addFriendInput.value.trim();
    
    // Проверяем что поле не пустое
    if (!inputValue) {
        showToast('Введите username или email', 'error');
        return;
    }
    
    // Блокируем кнопку на время отправки
    addFriendBtn.disabled = true;
    addFriendBtn.textContent = 'Отправка...';
    
    // Отправляем запрос
    sendFriendRequest(inputValue).then(success => {
        if (success) {
            addFriendInput.value = ''; // Очищаем поле при успехе
        }
    }).finally(() => {
        // Разблокируем кнопку
        addFriendBtn.disabled = false;
        addFriendBtn.textContent = 'Отправить заявку';
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Настраиваем обработчик отправки заявки
    const addFriendBtn = document.querySelector('.add-friend-form .btn-primary');
    const addFriendInput = document.querySelector('.add-friend-input');
    
    if (addFriendBtn && addFriendInput) {
        // Отправка по клику на кнопку
        addFriendBtn.addEventListener('click', handleFriendRequest);
        
        // Отправка по нажатию Enter
        addFriendInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleFriendRequest();
            }
        });
    }
});




// Обновляем функцию отправки заявки для автоматического обновления счетчиков
async function sendFriendRequest(usernameOrEmail) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://185.31.165.210:3001/api/friends/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usernameOrEmail: usernameOrEmail
            })
        });

        if (response.ok) {
            showToast('Заявка отправлена успешно!', 'success');
            
            // Очищаем поле ввода
            const input = document.querySelector('.add-friend-input');
            if (input) input.value = '';
            
            // Обновляем счетчик исходящих заявок
            if (window.requestsModule) {
                window.requestsModule.loadOutgoingRequests();
            }
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка отправки заявки');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast(error.message || 'Не удалось отправить заявку', 'error');
    }
}