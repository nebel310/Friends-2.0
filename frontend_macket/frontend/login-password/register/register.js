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
        <div class="toast-progress"></div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.5s ease forwards';
    }, 10);
    
    toast.querySelector('.toast-close').addEventListener('click', function() {
        closeToast(toast);
    });
    
    setTimeout(() => {
        closeToast(toast);
    }, 5000);
    
    return toast;
}

function closeToast(toast) {
    toast.style.animation = 'toastSlideOut 0.5s ease forwards';
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 500);
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

// Основной код формы
document.getElementById("form").addEventListener("submit", async function(event){
    event.preventDefault();

    document.querySelectorAll('.error-text').forEach(error => error.remove());
    
    let isValid = true;

    let firstName = document.getElementById("login");
    let email = document.getElementById("email"); 
    let passwordCheck = document.getElementById("passwordcheck");
    let password = document.getElementById("password");

    const errorForm = (message, input) => {
        input.style.borderColor = '#f87171';
        input.style.boxShadow = '0 0 0 2px rgba(248, 113, 113, 0.2)';
        showError(message);
        isValid = false;
    }

    [firstName, email, password, passwordCheck].forEach(input => {
        if (input) {
            input.style.borderColor = '#2a2a4a';
            input.style.boxShadow = 'none';
        }
    });

    // Валидация
    if(!firstName.value.trim()) {
        errorForm("Введите имя, поле не должно быть пустым", firstName);
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        errorForm("Введите корректный email", email);
    }

    if(password.value.trim().length < 6) {
        errorForm("Пароль должен быть не менее 6 символов", password);
    }

    if(passwordCheck.value.trim() !== password.value.trim()) {
        errorForm("Пароли не совпадают", passwordCheck);
    }

    // Если валидация прошла, отправляем на сервер
    if(isValid) {
        try {
            const userData = {
                firstName: firstName.value.trim(),
                email: email.value.trim(),
                password: password.value.trim()
            };

            const response = await fetch('http://185.31.165.210:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                showSuccess("Регистрация прошла успешно!");
                console.log('Ответ сервера:', result);
                
                // Сохраняем данные если нужно
                localStorage.setItem('userFirstName', firstName.value.trim());
                
                setTimeout(() => { 
                    window.location.href = 'login.html'; 
                }, 2000);
            } else {
                showError(`Ошибка: ${result.message || 'Неизвестная ошибка сервера'}`);
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            showError('Ошибка сети. Проверьте подключение к интернету.');
        }
    }
});