// app.js - Полностью локальное приложение
class FriendsApp {
    constructor() {
        this.currentUser = {
            firstName: "Иван",
            username: "ivan_petrov",
            email: "ivan@example.com"
        };

        // Локальное хранилище данных
        this.data = {
            pairs: [
                {
                    id: 1,
                    friend: { username: "anna_smith", email: "anna@example.com" },
                    status: "active"
                },
                {
                    id: 2, 
                    friend: { username: "max_johnson", email: "max@example.com" },
                    status: "active"
                }
            ],
            incomingRequests: [
                {
                    id: 1,
                    sender: { username: "alex_brown", email: "alex@example.com" },
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 2,
                    sender: { username: "sophia_wilson", email: "sophia@example.com" }, 
                    createdAt: new Date(Date.now() - 172800000).toISOString()
                }
            ],
            outgoingRequests: [
                {
                    id: 3,
                    receiver: { username: "mike_davis", email: "mike@example.com" },
                    createdAt: new Date(Date.now() - 43200000).toISOString()
                }
            ],
            archive: [
                {
                    id: 1,
                    user1: { username: "ivan_petrov" },
                    user2: { username: "anna_smith" },
                    title: "Совместное изучение React",
                    description: "Завершили изучение основных концепций React за 2 недели",
                    completedAt: new Date(Date.now() - 604800000).toISOString(),
                    points: 100
                },
                {
                    id: 2,
                    user1: { username: "max_johnson" },
                    user2: { username: "sophia_wilson" },
                    title: "Проект Todo App", 
                    description: "Разработали приложение для управления задачами",
                    completedAt: new Date(Date.now() - 1209600000).toISOString(),
                    points: 150
                }
            ]
        };

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadDashboard();
        this.updateUserInfo();
        this.showToast('🚀 Приложение загружено! Всё работает локально.', 'success');
    }

    // Обновление информации пользователя
    updateUserInfo() {
        const userElements = document.querySelectorAll('#userName, #userNameArchive, #userNameIncoming, #userNameOutgoing');
        const avatarElements = document.querySelectorAll('#userAvatar, #userAvatarArchive, #userAvatarIncoming, #userAvatarOutgoing');
        
        userElements.forEach(el => el.textContent = this.currentUser.firstName);
        avatarElements.forEach(el => el.textContent = this.currentUser.firstName.charAt(0));
    }

    // Навигация между страницами
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Убираем активные классы
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                const page = item.getAttribute('data-page');
                this.showPage(page);
            });
        });
    }

    // Показать страницу
    showPage(page) {
        // Скрываем все страницы
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        
        switch(page) {
            case 'dashboard':
                document.getElementById('dashboardContent').classList.add('active');
                this.loadDashboard();
                break;
            case 'archive':
                document.getElementById('archiveContent').classList.add('active');
                this.loadArchive();
                break;
            case 'incoming':
                document.getElementById('incomingContent').classList.add('active');
                this.loadIncomingRequests();
                break;
            case 'outgoing':
                document.getElementById('outgoingContent').classList.add('active');
                this.loadOutgoingRequests();
                break;
        }
    }

    // Загрузка главной страницы
    loadDashboard() {
        this.displayActivePairs();
        this.updateSidebarPairs();
    }

    // Отображение активных пар
    displayActivePairs() {
        const container = document.getElementById('activePairsContent');
        
        if (this.data.pairs.length === 0) {
            container.innerHTML = `
                <div class="empty-dashboard">
                    <div class="empty-icon-large">👥</div>
                    <h2 class="empty-title">У вас пока нет пар</h2>
                    <p class="empty-description">Начните добавлять друзей, чтобы создавать пары и выполнять задания вместе</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.pairs.map(pair => `
            <div class="pair-card">
                <div class="pair-header">
                    <div class="pair-user">
                        <div class="pair-avatar">${pair.friend.username.charAt(0).toUpperCase()}</div>
                        <div class="pair-info">
                            <h3>${pair.friend.username}</h3>
                            <p>${pair.friend.email}</p>
                        </div>
                    </div>
                    <div class="pair-status status-active">Активна</div>
                </div>
                <div class="pair-actions">
                    <button class="btn btn-primary btn-small" onclick="app.openChat(${pair.id})">
                        💬 Написать
                    </button>
                    <button class="btn btn-error btn-small" onclick="app.removePair(${pair.id})">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Обновление пар в сайдбаре
    updateSidebarPairs() {
        const container = document.getElementById('activePairsList');
        
        if (this.data.pairs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <div class="empty-text">Нет активных пар</div>
                </div>
            `;
            return;
        }

        const displayedPairs = this.data.pairs.slice(0, 3);
        container.innerHTML = displayedPairs.map(pair => `
            <div class="nav-item">
                <div class="nav-icon">👤</div>
                <span>${pair.friend.username}</span>
            </div>
        `).join('');

        if (this.data.pairs.length > 3) {
            container.innerHTML += `
                <div class="empty-state">
                    <div class="empty-text">И еще ${this.data.pairs.length - 3}</div>
                </div>
            `;
        }
    }

    // Загрузка архива
    loadArchive() {
        const container = document.getElementById('archiveFeed');
        
        if (this.data.archive.length === 0) {
            container.innerHTML = `
                <div class="empty-state-content">
                    <div class="empty-icon-large">📊</div>
                    <h2 class="empty-title">Архив пуст</h2>
                    <p class="empty-description">
                        Здесь будут появляться выполненные задания от всех пользователей.<br>
                        Когда вы или другие пользователи завершат задания - они появятся здесь.
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.archive.map(task => `
            <div class="archive-item">
                <div class="archive-header">
                    <div class="archive-users">
                        <span class="user-badge">${task.user1.username.charAt(0).toUpperCase()}</span>
                        <span>+</span>
                        <span class="user-badge">${task.user2.username.charAt(0).toUpperCase()}</span>
                        <span>${task.user1.username} и ${task.user2.username}</span>
                    </div>
                    <div class="archive-date">${new Date(task.completedAt).toLocaleDateString()}</div>
                </div>
                <div class="archive-task">${task.title}</div>
                <div class="archive-description">${task.description}</div>
                <div class="archive-points">+${task.points} очков</div>
            </div>
        `).join('');
    }

    // Загрузка входящих заявок
    loadIncomingRequests() {
        const container = document.getElementById('incomingRequestsList');
        this.updateIncomingCount();

        if (this.data.incomingRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state-content">
                    <div class="empty-icon-large">📥</div>
                    <h2 class="empty-title">Нет входящих заявок</h2>
                    <p class="empty-description">Когда кто-то отправит вам заявку в друзья, она появится здесь</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.incomingRequests.map(request => `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="request-user">
                        <div class="request-avatar">${request.sender.username.charAt(0).toUpperCase()}</div>
                        <div class="request-info">
                            <h3>${request.sender.username}</h3>
                            <p>${request.sender.email}</p>
                        </div>
                    </div>
                    <div class="request-date">${new Date(request.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-success btn-small" onclick="app.acceptRequest(${request.id})">
                        Принять
                    </button>
                    <button class="btn btn-error btn-small" onclick="app.rejectRequest(${request.id})">
                        Отклонить
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Загрузка исходящих заявок
    loadOutgoingRequests() {
        const container = document.getElementById('outgoingRequestsList');
        this.updateOutgoingCount();

        if (this.data.outgoingRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state-content">
                    <div class="empty-icon-large">📤</div>
                    <h2 class="empty-title">Нет исходящих заявок</h2>
                    <p class="empty-description">Заявки, которые вы отправили, будут отображаться здесь</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.outgoingRequests.map(request => `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="request-user">
                        <div class="request-avatar">${request.receiver.username.charAt(0).toUpperCase()}</div>
                        <div class="request-info">
                            <h3>${request.receiver.username}</h3>
                            <p>${request.receiver.email}</p>
                        </div>
                    </div>
                    <div class="request-status">
                        <span class="pair-status status-pending">Ожидание</span>
                    </div>
                </div>
                <div class="request-date">Отправлено: ${new Date(request.createdAt).toLocaleDateString()}</div>
                <div class="request-actions">
                    <button class="btn btn-error btn-small" onclick="app.cancelRequest(${request.id})">
                        Отменить заявку
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Обновление счетчиков
    updateIncomingCount() {
        const badge = document.getElementById('incomingCount');
        if (this.data.incomingRequests.length > 0) {
            badge.textContent = this.data.incomingRequests.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    updateOutgoingCount() {
        const badge = document.getElementById('outgoingCount');
        if (this.data.outgoingRequests.length > 0) {
            badge.textContent = this.data.outgoingRequests.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // Отправка заявки в друзья
    sendFriendRequest(username) {
        if (!username.trim()) {
            this.showToast('Введите username', 'error');
            return;
        }

        // Имитация загрузки
        const btn = document.querySelector('.add-friend-form .btn-primary');
        const originalText = btn.textContent;
        btn.textContent = 'Отправка...';
        btn.disabled = true;

        setTimeout(() => {
            const newRequest = {
                id: Date.now(),
                receiver: { 
                    username: username,
                    email: `${username}@example.com`
                },
                createdAt: new Date().toISOString()
            };

            this.data.outgoingRequests.push(newRequest);
            this.updateOutgoingCount();
            
            this.showToast(`Заявка отправлена пользователю ${username}`, 'success');
            
            // Очищаем поле ввода
            document.querySelector('.add-friend-input').value = '';
            
            // Восстанавливаем кнопку
            btn.textContent = originalText;
            btn.disabled = false;

            // Если на странице исходящих - обновляем
            if (document.getElementById('outgoingContent').classList.contains('active')) {
                this.loadOutgoingRequests();
            }
        }, 1000);
    }

    // Принять заявку
    acceptRequest(requestId) {
        const request = this.data.incomingRequests.find(r => r.id === requestId);
        if (!request) return;

        // Добавляем в пары
        this.data.pairs.push({
            id: Date.now(),
            friend: request.sender,
            status: "active"
        });

        // Удаляем из входящих заявок
        this.data.incomingRequests = this.data.incomingRequests.filter(r => r.id !== requestId);
        
        this.showToast(`Теперь вы друзья с ${request.sender.username}!`, 'success');
        this.loadIncomingRequests();
        this.loadDashboard();
    }

    // Отклонить заявку
    rejectRequest(requestId) {
        const request = this.data.incomingRequests.find(r => r.id === requestId);
        if (!request) return;

        this.data.incomingRequests = this.data.incomingRequests.filter(r => r.id !== requestId);
        
        this.showToast(`Заявка от ${request.sender.username} отклонена`, 'info');
        this.loadIncomingRequests();
    }

    // Отменить заявку
    cancelRequest(requestId) {
        const request = this.data.outgoingRequests.find(r => r.id === requestId);
        if (!request) return;

        this.data.outgoingRequests = this.data.outgoingRequests.filter(r => r.id !== requestId);
        
        this.showToast(`Заявка для ${request.receiver.username} отменена`, 'info');
        this.loadOutgoingRequests();
    }

    // Удалить пару
    removePair(pairId) {
        if (confirm('Вы уверены, что хотите удалить эту пару?')) {
            this.data.pairs = this.data.pairs.filter(p => p.id !== pairId);
            this.showToast('Пара удалена', 'success');
            this.loadDashboard();
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Отправка заявки
        const addFriendBtn = document.querySelector('.add-friend-form .btn-primary');
        const addFriendInput = document.querySelector('.add-friend-input');
        
        if (addFriendBtn && addFriendInput) {
            addFriendBtn.addEventListener('click', () => {
                this.sendFriendRequest(addFriendInput.value.trim());
            });
            
            addFriendInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendFriendRequest(addFriendInput.value.trim());
                }
            });
        }

        // Выход
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Выйти из приложения?')) {
                this.showToast('До встречи!', 'info');
                // В реальном приложении здесь был бы редирект на логин
            }
        });
    }

    // Вспомогательные методы
    openChat(pairId) {
        this.showToast('Функция чата в разработке', 'info');
    }

    // Уведомления
    showToast(message, type = 'info') {
        // Создаем контейнер если его нет
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        
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
        
        // Закрытие
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.closeToast(toast);
        });
        
        // Авто-закрытие
        setTimeout(() => {
            this.closeToast(toast);
        }, 5000);
    }

    closeToast(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }
}

// Запуск приложения
const app = new FriendsApp();