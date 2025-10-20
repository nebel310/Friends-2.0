// requests.js - Управление заявками в друзья

const API_BASE = 'http://185.31.165.210:3001/api';

// Загрузка входящих заявок
async function loadIncomingRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/friends/requests/incoming`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const requests = await response.json();
            displayIncomingRequests(requests);
            updateIncomingCount(requests.length);
        } else {
            throw new Error('Ошибка загрузки входящих заявок');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Не удалось загрузить входящие заявки', 'error');
    }
}

// Загрузка исходящих заявок
async function loadOutgoingRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/friends/requests/outgoing`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const requests = await response.json();
            displayOutgoingRequests(requests);
            updateOutgoingCount(requests.length);
        } else {
            throw new Error('Ошибка загрузки исходящих заявок');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Не удалось загрузить исходящие заявки', 'error');
    }
}

// Отображение входящих заявок
function displayIncomingRequests(requests) {
    const container = document.getElementById('incomingRequestsList');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-icon-large">📥</div>
                <h2 class="empty-title">Нет входящих заявок</h2>
                <p class="empty-description">Когда кто-то отправит вам заявку в друзья, она появится здесь</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(request => `
        <div class="request-card" data-request-id="${request.id}">
            <div class="request-header">
                <div class="request-user">
                    <div class="request-avatar">${request.sender?.username?.charAt(0).toUpperCase() || 'U'}</div>
                    <div class="request-info">
                        <h3>${request.sender?.username || 'Неизвестный пользователь'}</h3>
                        <p>${request.sender?.email || ''}</p>
                    </div>
                </div>
                <div class="request-date">${new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="request-actions">
                <button class="btn btn-success btn-small accept-request" data-request-id="${request.id}">
                    Принять
                </button>
                <button class="btn btn-error btn-small reject-request" data-request-id="${request.id}">
                    Отклонить
                </button>
            </div>
        </div>
    `).join('');

    // Добавляем обработчики событий
    container.querySelectorAll('.accept-request').forEach(btn => {
        btn.addEventListener('click', handleAcceptRequest);
    });

    container.querySelectorAll('.reject-request').forEach(btn => {
        btn.addEventListener('click', handleRejectRequest);
    });
}

// Отображение исходящих заявок
function displayOutgoingRequests(requests) {
    const container = document.getElementById('outgoingRequestsList');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-icon-large">📤</div>
                <h2 class="empty-title">Нет исходящих заявок</h2>
                <p class="empty-description">Заявки, которые вы отправили, будут отображаться здесь</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(request => `
        <div class="request-card" data-request-id="${request.id}">
            <div class="request-header">
                <div class="request-user">
                    <div class="request-avatar">${request.receiver?.username?.charAt(0).toUpperCase() || 'U'}</div>
                    <div class="request-info">
                        <h3>${request.receiver?.username || 'Неизвестный пользователь'}</h3>
                        <p>${request.receiver?.email || ''}</p>
                    </div>
                </div>
                <div class="request-status">
                    <span class="pair-status status-pending">Ожидание</span>
                </div>
            </div>
            <div class="request-date">Отправлено: ${new Date(request.createdAt).toLocaleDateString()}</div>
            <div class="request-actions">
                <button class="btn btn-error btn-small cancel-request" data-request-id="${request.id}">
                    Отменить заявку
                </button>
            </div>
        </div>
    `).join('');

    // Добавляем обработчики событий
    container.querySelectorAll('.cancel-request').forEach(btn => {
        btn.addEventListener('click', handleCancelRequest);
    });
}

// Обновление счетчиков заявок
function updateIncomingCount(count) {
    const badge = document.getElementById('incomingCount');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function updateOutgoingCount(count) {
    const badge = document.getElementById('outgoingCount');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Обработка принятия заявки
async function handleAcceptRequest(event) {
    const requestId = event.target.getAttribute('data-request-id');
    const card = event.target.closest('.request-card');
    
    try {
        card.classList.add('loading');
        event.target.disabled = true;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/friends/requests/${requestId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Заявка принята! Теперь вы друзья', 'success');
            // Перезагружаем списки
            loadIncomingRequests();
            loadActivePairs();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при принятии заявки');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast(error.message || 'Не удалось принять заявку', 'error');
    } finally {
        card.classList.remove('loading');
        event.target.disabled = false;
    }
}

// Обработка отклонения заявки
async function handleRejectRequest(event) {
    const requestId = event.target.getAttribute('data-request-id');
    const card = event.target.closest('.request-card');
    
    try {
        card.classList.add('loading');
        event.target.disabled = true;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/friends/requests/${requestId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Заявка отклонена', 'info');
            // Перезагружаем список
            loadIncomingRequests();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при отклонении заявки');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast(error.message || 'Не удалось отклонить заявку', 'error');
    } finally {
        card.classList.remove('loading');
        event.target.disabled = false;
    }
}

// Обработка отмены заявки
async function handleCancelRequest(event) {
    const requestId = event.target.getAttribute('data-request-id');
    const card = event.target.closest('.request-card');
    
    try {
        card.classList.add('loading');
        event.target.disabled = true;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/friends/requests/${requestId}/cancel`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Заявка отменена', 'info');
            // Перезагружаем список
            loadOutgoingRequests();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при отмене заявки');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast(error.message || 'Не удалось отменить заявку', 'error');
    } finally {
        card.classList.remove('loading');
        event.target.disabled = false;
    }
}

// Показать страницу входящих заявок
function showIncomingRequests() {
    hideAllPages();
    document.getElementById('incomingContent').classList.add('active');
    loadIncomingRequests();
}

// Показать страницу исходящих заявок
function showOutgoingRequests() {
    hideAllPages();
    document.getElementById('outgoingContent').classList.add('active');
    loadOutgoingRequests();
}

// Скрыть все страницы
function hideAllPages() {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
}

// Инициализация модуля заявок
function initializeRequests() {
    // Загрузка заявок при открытии соответствующих страниц
    // Обработчики навигации уже настроены в dashboard.js
}

// Экспортируем функции для использования в других модулях
window.requestsModule = {
    loadIncomingRequests,
    loadOutgoingRequests,
    showIncomingRequests,
    showOutgoingRequests
};