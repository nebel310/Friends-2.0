// dashboard.js - Основной функционал дашборда
const API_BASE = 'http://185.31.165.210:3001/api';

// Получаем данные пользователя с сервера
async function getUserData() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            updateUserInterface(userData);
            return userData;
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } else {
            throw new Error('Ошибка загрузки данных пользователя');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('userName').textContent = 'Ошибка загрузки';
        document.getElementById('userAvatar').textContent = '!';
    }
}

// Обновляем интерфейс с данными пользователя
function updateUserInterface(userData) {
    const userElements = document.querySelectorAll('#userName, #userNameArchive, #userNameIncoming, #userNameOutgoing');
    const avatarElements = document.querySelectorAll('#userAvatar, #userAvatarArchive, #userAvatarIncoming, #userAvatarOutgoing');
    
    let displayName = 'Пользователь';
    let initial = 'П';

    if (userData.firstName) {
        displayName = userData.firstName;
        initial = userData.firstName.charAt(0).toUpperCase();
    } else if (userData.username) {
        displayName = userData.username;
        initial = userData.username.charAt(0).toUpperCase();
    } else if (userData.email) {
        displayName = userData.email.split('@')[0];
        initial = userData.email.charAt(0).toUpperCase();
    }

    userElements.forEach(element => {
        element.textContent = displayName;
    });

    avatarElements.forEach(element => {
        element.textContent = initial;
    });
}

// Загрузка активных пар
async function loadActivePairs() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/friends/pairs`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const pairs = await response.json();
            displayActivePairs(pairs);
            updateSidebarPairs(pairs);
        } else {
            throw new Error('Ошибка загрузки активных пар');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showEmptyPairsState();
    }
}

// Отображение активных пар в основном контенте
function displayActivePairs(pairs) {
    const container = document.getElementById('activePairsContent');
    
    if (!pairs || pairs.length === 0) {
        showEmptyPairsState();
        return;
    }

    container.innerHTML = pairs.map(pair => `
        <div class="pair-card">
            <div class="pair-header">
                <div class="pair-user">
                    <div class="pair-avatar">${pair.friend?.username?.charAt(0).toUpperCase() || 'Д'}</div>
                    <div class="pair-info">
                        <h3>${pair.friend?.username || 'Друг'}</h3>
                        <p>${pair.friend?.email || ''}</p>
                    </div>
                </div>
                <div class="pair-status status-active">Активна</div>
            </div>
            <div class="pair-actions">
                <button class="btn btn-primary btn-small" onclick="openChat(${pair.id})">
                    💬 Написать
                </button>
                <button class="btn btn-error btn-small" onclick="removePair(${pair.id})">
                    🗑️ Удалить
                </button>
            </div>
        </div>
    `).join('');
}

// Показать состояние "нет пар"
function showEmptyPairsState() {
    const container = document.getElementById('activePairsContent');
    container.innerHTML = `
        <div class="empty-dashboard">
            <div class="empty-icon-large">👥</div>
            <h2 class="empty-title">У вас пока нет пар</h2>
            <p class="empty-description">Начните добавлять друзей, чтобы создавать пары и выполнять задания вместе</p>
        </div>
    `;
}

// Обновление пар в сайдбаре
function updateSidebarPairs(pairs) {
    const container = document.getElementById('activePairsList');
    
    if (!pairs || pairs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <div class="empty-text">Нет активных пар</div>
            </div>
        `;
        return;
    }

    // Показываем только первые 3 пары в сайдбаре
    const displayedPairs = pairs.slice(0, 3);
    container.innerHTML = displayedPairs.map(pair => `
        <a href="#" class="nav-item pair-item" data-pair-id="${pair.id}">
            <div class="nav-icon">👤</div>
            <span>${pair.friend?.username || 'Друг'}</span>
        </a>
    `).join('');

    // Если пар больше 3, показываем "и еще X"
    if (pairs.length > 3) {
        container.innerHTML += `
            <div class="empty-state">
                <div class="empty-text">И еще ${pairs.length - 3}</div>
            </div>
        `;
    }
}

// Настройка навигации
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.getAttribute('data-page');
            
            // Убираем активные классы у всех
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Добавляем активный класс текущему
            this.classList.add('active');
            
            // Переключаем страницы
            switch(page) {
                case 'dashboard':
                    showDashboard();
                    break;
                case 'archive':
                    showArchive();
                    break;
                case 'incoming':
                    showIncomingRequests();
                    break;
                case 'outgoing':
                    showOutgoingRequests();
                    break;
            }
        });
    });
}

// Показать главную страницу
function showDashboard() {
    hideAllPages();
    document.getElementById('dashboardContent').classList.add('active');
    loadActivePairs();
}

// Функция выхода
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
}

// Периодическое обновление данных
function startDataRefresh() {
    // Обновляем данные каждые 30 секунд
    setInterval(() => {
        loadActivePairs();
        if (window.requestsModule) {
            window.requestsModule.loadIncomingRequests();
            window.requestsModule.loadOutgoingRequests();
        }
    }, 30000);
}

// Инициализация дашборда
async function initializeDashboard() {
    checkAuth();
    
    // Загружаем данные пользователя
    const userData = await getUserData();
    
    if (userData) {
        // Настраиваем навигацию
        setupNavigation();
        
        // Настраиваем выход
        setupLogout();
        
        // Загружаем начальные данные
        showDashboard();
        
        // Запускаем периодическое обновление
        startDataRefresh();
        
        // Инициализируем модуль заявок
        if (window.requestsModule) {
            window.requestsModule.initializeRequests();
        }
    }
}

// Вспомогательные функции (заглушки для демо)
function openChat(pairId) {
    showToast('Функция чата в разработке', 'info');
}

function removePair(pairId) {
    if (confirm('Вы уверены, что хотите удалить эту пару?')) {
        showToast('Пара удалена', 'success');
        // Здесь будет реальный API вызов
        loadActivePairs(); // Перезагружаем список
    }
}

// Запускаем когда DOM загружен
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Экспортируем функции для использования в других модулях
window.dashboardModule = {
    showDashboard,
    loadActivePairs,
    getUserData
};