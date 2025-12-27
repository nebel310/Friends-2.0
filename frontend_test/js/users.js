// Класс для управления страницей пользователей (версия с карточками)
class UsersPage {
    constructor() {
        this.api = new API();
        this.ui = new UI();
        this.friends = new Friends();
        
        this.currentPage = 0;
        this.pageSize = 12; // Меньше карточек для более быстрой загрузки
        this.hasMore = true;
        this.isLoading = false;
        this.isLoadingMore = false;
        this.totalUsers = 0;
        
        this.filters = {
            q: '',
            gender: '',
            min_age: null,
            max_age: null
        };
        
        // Данные для проверки статуса дружбы
        this.myFriends = []; // массив id друзей
        this.myFriendRequests = []; // массив id пользователей, которым отправил заявку
        this.myIncomingRequests = []; // массив id пользователей, которые отправили мне заявку
        
        // Флаг для отслеживания открытия фильтров
        this.filtersVisible = false;
    }

    async init() {
        try {
            // Загружаем статистику
            await this.loadStats();
            
            // Загружаем данные о друзьях и заявках
            await this.loadFriendsAndRequests();
            
            // Загружаем первую страницу пользователей
            await this.loadUsers();
            
            // Настраиваем обработчики
            this.setupEventListeners();
            
            // Настраиваем бесконечный скролл
            this.setupInfiniteScroll();
            
        } catch (error) {
            console.error('Error initializing users page:', error);
            this.ui.showNotification('Ошибка инициализации страницы: ' + error.message, 'error');
        }
    }

    async loadStats() {
        try {
            const stats = await this.api.get('/users/stats');
            this.renderStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderStats(stats) {
        const container = document.getElementById('stats-container');
        const statsGrid = document.getElementById('stats-grid');
        
        if (!stats || !container || !statsGrid) return;
        
        container.style.display = 'block';
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-title">Всего пользователей</div>
                <div class="stat-value">${stats.total_users}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Мужчины</div>
                <div class="stat-value">${stats.male_users}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Женщины</div>
                <div class="stat-value">${stats.female_users}</div>
            </div>
        `;
    }

    async loadFriendsAndRequests() {
        try {
            // Загружаем друзей
            const friends = await this.api.get('/friends/?limit=1000&offset=0');
            this.myFriends = friends.map(f => f.id);
            
            // Загружаем входящие заявки
            const incomingRequests = await this.api.get('/friends/get_requests');
            this.myIncomingRequests = incomingRequests.map(req => req.user_id);
            
            // Загружаем исходящие заявки - нам нужно получить все заявки и отфильтровать
            // Для этого используем подход: получаем всех пользователей, с которыми есть pending статус
            // Но проще пока будем считать, что если не друг и не входящая заявка, то можно отправить
            // Позже можно доработать если нужно точное определение
            this.myFriendRequests = [];
            
        } catch (error) {
            console.error('Error loading friends and requests:', error);
            // Не показываем ошибку пользователю
        }
    }

    async loadUsers(reset = false) {
        if (this.isLoading) return;
        
        if (reset) {
            this.currentPage = 0;
            this.hasMore = true;
            this.isLoading = true;
            this.showLoading();
        } else if (this.isLoadingMore) {
            return;
        } else {
            this.isLoadingMore = true;
            document.getElementById('loading-more').style.display = 'block';
        }
        
        try {
            // Собираем параметры запроса
            const params = new URLSearchParams();
            params.append('limit', this.pageSize);
            params.append('offset', this.currentPage * this.pageSize);
            
            if (this.filters.q) params.append('q', this.filters.q);
            if (this.filters.gender) params.append('gender', this.filters.gender);
            if (this.filters.min_age !== null) params.append('min_age', this.filters.min_age);
            if (this.filters.max_age !== null) params.append('max_age', this.filters.max_age);
            
            const response = await this.api.get(`/users?${params.toString()}`);
            
            const users = response.users;
            this.totalUsers = response.total;
            
            // Обновляем счетчик пользователей
            this.updateUsersCount();
            
            if (reset) {
                document.getElementById('users-grid').innerHTML = '';
                document.getElementById('no-results').style.display = 'none';
            }
            
            if (users.length === 0) {
                if (this.currentPage === 0) {
                    this.showNoResults();
                }
                this.hasMore = false;
                document.getElementById('no-more-results').style.display = 'none';
            } else {
                this.renderUsers(users);
                this.currentPage++;
                
                // Проверяем, есть ли еще пользователи
                if (users.length < this.pageSize || this.currentPage * this.pageSize >= this.totalUsers) {
                    this.hasMore = false;
                    document.getElementById('no-more-results').style.display = 'block';
                } else {
                    this.hasMore = true;
                    document.getElementById('no-more-results').style.display = 'none';
                }
            }
            
        } catch (error) {
            console.error('Error loading users:', error);
            if (this.currentPage === 0) {
                document.getElementById('users-grid').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">😕</div>
                        <h4>Ошибка загрузки</h4>
                        <p>${error.message}</p>
                    </div>
                `;
            }
            this.ui.showNotification('Ошибка загрузки пользователей: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
            this.isLoadingMore = false;
            document.getElementById('loading-more').style.display = 'none';
        }
    }

    showLoading() {
        document.getElementById('users-grid').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <div class="loading">Загрузка пользователей...</div>
            </div>
        `;
    }

    showNoResults() {
        document.getElementById('users-grid').innerHTML = '';
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('no-more-results').style.display = 'none';
    }

    updateUsersCount() {
        const countElement = document.getElementById('users-count');
        if (countElement) {
            countElement.textContent = `${this.totalUsers} пользователей`;
        }
    }

    renderUsers(users) {
        const container = document.getElementById('users-grid');
        document.getElementById('no-results').style.display = 'none';
        
        users.forEach((user, index) => {
            const userElement = this.createUserCard(user);
            container.appendChild(userElement);
            
            // Добавляем небольшую задержку для анимации
            setTimeout(() => {
                userElement.style.opacity = '1';
                userElement.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Определяем статус кнопки добавления в друзья
        const isFriend = this.myFriends.includes(user.id);
        const hasIncomingRequest = this.myIncomingRequests.includes(user.id);
        const hasOutgoingRequest = this.myFriendRequests.includes(user.id);
        
        let buttonText = 'Добавить в друзья';
        let buttonDisabled = false;
        let buttonClass = 'user-card-btn user-card-btn-primary';
        
        if (isFriend) {
            buttonText = 'Уже друзья';
            buttonDisabled = true;
            buttonClass = 'user-card-btn user-card-btn-disabled';
        } else if (hasIncomingRequest) {
            buttonText = 'Принять заявку';
            buttonClass = 'user-card-btn user-card-btn-success';
        } else if (hasOutgoingRequest) {
            buttonText = 'Заявка отправлена';
            buttonDisabled = true;
            buttonClass = 'user-card-btn user-card-btn-disabled';
        }
        
        // Форматируем возраст
        const ageText = user.age ? `${user.age} лет` : 'Возраст не указан';
        const genderText = user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : 'Не указан';
        const genderIcon = user.gender === 'male' ? 'mars' : user.gender === 'female' ? 'venus' : 'genderless';
        
        // Обрезаем био если слишком длинное
        let bioText = user.bio || 'Пользователь пока не добавил информацию о себе';
        if (bioText.length > 120) {
            bioText = bioText.substring(0, 120) + '...';
        }
        
        card.innerHTML = `
            <div class="user-card-avatar-container">
                ${user.avatar_filename ? 
                    `<img src="http://localhost:3001/files/download/avatars/${user.avatar_filename}" 
                          alt="${user.username}" 
                          class="user-card-avatar"
                          onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div class=\\'user-card-avatar-default\\'>${user.username.charAt(0).toUpperCase()}</div>';">` :
                    `<div class="user-card-avatar-default">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>`
                }
            </div>
            <div class="user-card-info">
                <div class="user-card-name">${user.username}</div>
                <div class="user-card-details">
                    <div class="user-card-details-item">
                        <i class="fas fa-${genderIcon}"></i>
                        <span>${genderText}</span>
                    </div>
                    <div class="user-card-details-item">
                        <i class="fas fa-birthday-cake"></i>
                        <span>${ageText}</span>
                    </div>
                </div>
                <div class="user-card-bio">${bioText}</div>
                <div class="user-card-actions">
                    <button class="${buttonClass}" 
                            data-user-id="${user.id}"
                            data-username="${user.username}"
                            ${buttonDisabled ? 'disabled' : ''}
                            onclick="event.stopPropagation(); window.usersPage.handleAddFriend(${user.id}, '${user.username.replace(/'/g, "\\'")}', this)">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
        
        // Добавляем обработчик клика на карточку
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.showUserDetail(user);
            }
        });
        
        return card;
    }

    async handleAddFriend(userId, username, buttonElement) {
        try {
            // Визуальная обратная связь
            const originalText = buttonElement.textContent;
            buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            buttonElement.disabled = true;
            
            // Используем существующий функционал из friends.js
            await this.friends.sendFriendRequest(username);
            
            // Обновляем состояние кнопки
            buttonElement.textContent = 'Заявка отправлена';
            buttonElement.className = 'user-card-btn user-card-btn-disabled';
            buttonElement.disabled = true;
            
            // Добавляем пользователя в список тех, кому отправили заявку
            if (!this.myFriendRequests.includes(userId)) {
                this.myFriendRequests.push(userId);
            }
            
            // Показываем уведомление
            this.ui.showNotification(`Заявка отправлена пользователю ${username}!`, 'success');
            
        } catch (error) {
            console.error('Error sending friend request:', error);
            
            // Возвращаем кнопку в исходное состояние
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
            
            this.ui.showNotification('Ошибка отправки заявки: ' + error.message, 'error');
        }
    }

    async showUserDetail(user) {
        try {
            // Загружаем детальную информацию о пользователе
            const userDetail = await this.api.get(`/users/${user.id}`);
            
            const modal = document.getElementById('user-detail-modal');
            const content = document.getElementById('user-detail-content');
            
            const ageText = userDetail.age ? `${userDetail.age} лет` : 'Не указан';
            const genderText = userDetail.gender === 'male' ? 'Мужской' : userDetail.gender === 'female' ? 'Женский' : 'Не указан';
            const registeredDate = new Date(userDetail.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Определяем статус кнопки добавления в друзья
            const isFriend = this.myFriends.includes(userDetail.id);
            const hasIncomingRequest = this.myIncomingRequests.includes(userDetail.id);
            const hasOutgoingRequest = this.myFriendRequests.includes(userDetail.id);
            
            let buttonText = 'Добавить в друзья';
            let buttonDisabled = false;
            let buttonClass = 'user-detail-btn user-detail-btn-primary';
            
            if (isFriend) {
                buttonText = 'Уже друзья';
                buttonDisabled = true;
                buttonClass = 'user-detail-btn user-detail-btn-disabled';
            } else if (hasIncomingRequest) {
                buttonText = 'Принять заявку';
                buttonClass = 'user-detail-btn user-detail-btn-primary';
            } else if (hasOutgoingRequest) {
                buttonText = 'Заявка отправлена';
                buttonDisabled = true;
                buttonClass = 'user-detail-btn user-detail-btn-disabled';
            }
            
            content.innerHTML = `
                <div class="user-detail-header">
                    ${userDetail.avatar_filename ? 
                        `<img src="http://localhost:3001/files/download/avatars/${userDetail.avatar_filename}" 
                            alt="${userDetail.username}" 
                            class="user-detail-avatar"
                            onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div class=\\"user-detail-avatar-default\\" style=\\"width:100%;height:100%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:white;font-size:4rem;\\">${userDetail.username.charAt(0).toUpperCase()}</div>';">` :
                        `<div class="user-detail-avatar-default" style="width:100%;height:100%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:white;font-size:4rem;">
                            ${userDetail.username.charAt(0).toUpperCase()}
                        </div>`
                    }
                </div>
                <div class="user-detail-scrollable custom-scrollbar">
                    <div class="user-detail-info">
                        <div class="user-detail-name">${userDetail.username}</div>
                        <div class="user-detail-details">
                            <div class="user-detail-detail-item">
                                <div class="user-detail-detail-label">Пол</div>
                                <div class="user-detail-detail-value">${genderText}</div>
                            </div>
                            <div class="user-detail-detail-item">
                                <div class="user-detail-detail-label">Возраст</div>
                                <div class="user-detail-detail-value">${ageText}</div>
                            </div>
                            <div class="user-detail-detail-item">
                                <div class="user-detail-detail-label">На сайте с</div>
                                <div class="user-detail-detail-value">${registeredDate}</div>
                            </div>
                        </div>
                        
                        ${userDetail.bio ? `
                            <div class="user-detail-section">
                                <div class="user-detail-section-title">О себе</div>
                                <div class="user-detail-bio">${userDetail.bio}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="user-detail-actions">
                    <button class="${buttonClass}" 
                            id="modal-add-friend-btn"
                            data-user-id="${userDetail.id}"
                            data-username="${userDetail.username}"
                            ${buttonDisabled ? 'disabled' : ''}>
                        <i class="fas fa-user-plus"></i>
                        ${buttonText}
                    </button>
                </div>
            `;
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Обработчик для кнопки в модальном окне
            const addFriendBtn = document.getElementById('modal-add-friend-btn');
            if (addFriendBtn && !buttonDisabled) {
                addFriendBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    
                    // Визуальная обратная связь
                    const originalText = addFriendBtn.textContent;
                    addFriendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
                    addFriendBtn.disabled = true;
                    
                    try {
                        await this.handleAddFriend(userDetail.id, userDetail.username, addFriendBtn);
                        
                        // Закрываем модальное окно после успешной отправки
                        setTimeout(() => {
                            this.closeUserDetailModal();
                        }, 1000);
                        
                    } catch (error) {
                        // В случае ошибки возвращаем кнопку в исходное состояние
                        addFriendBtn.innerHTML = `<i class="fas fa-user-plus"></i> ${originalText}`;
                        addFriendBtn.disabled = false;
                    }
                });
            }
            
            // Закрытие модального окна
            this.setupModalCloseHandlers();
            
        } catch (error) {
            console.error('Error loading user details:', error);
            this.ui.showNotification('Ошибка загрузки информации о пользователе: ' + error.message, 'error');
        }
    }

    setupModalCloseHandlers() {
        const modal = document.getElementById('user-detail-modal');
        const closeBtn = modal.querySelector('.modal-close');
        
        const closeModal = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };
        
        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleEscape);
        
        // Сохраняем ссылки на обработчики для последующего удаления
        this.modalCloseHandlers = { closeModal, handleOverlayClick, handleEscape };
    }

    closeUserDetailModal() {
        const modal = document.getElementById('user-detail-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Удаляем обработчики
            if (this.modalCloseHandlers) {
                document.removeEventListener('keydown', this.modalCloseHandlers.handleEscape);
                this.modalCloseHandlers = null;
            }
        }
    }

    setupEventListeners() {
        // Переключение фильтров
        document.getElementById('toggle-filters').addEventListener('click', () => {
            this.toggleFilters();
        });
        
        // Применение фильтров
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
            this.toggleFilters(false); // Закрываем фильтры после применения
        });
        
        // Сброс фильтров
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
            this.toggleFilters(false); // Закрываем фильтры после сброса
        });
        
        // Поиск при нажатии Enter
        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });
        
        // Автоматический поиск при изменении (с дебаунсом)
        let searchTimeout;
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.applyFilters();
            }, 800);
        });
        
        // Закрытие фильтров при клике вне области
        document.addEventListener('click', (e) => {
            const filtersDropdown = document.getElementById('filters-dropdown');
            const toggleButton = document.getElementById('toggle-filters');
            
            if (this.filtersVisible && 
                filtersDropdown && 
                !filtersDropdown.contains(e.target) && 
                !toggleButton.contains(e.target)) {
                this.toggleFilters(false);
            }
        });
    }

    toggleFilters(show = null) {
        const filtersDropdown = document.getElementById('filters-dropdown');
        const toggleButton = document.getElementById('toggle-filters');
        
        if (show === null) {
            show = !this.filtersVisible;
        }
        
        this.filtersVisible = show;
        
        if (show) {
            filtersDropdown.style.display = 'block';
            toggleButton.innerHTML = '<i class="fas fa-filter"></i> Скрыть фильтры';
            toggleButton.classList.add('active');
        } else {
            filtersDropdown.style.display = 'none';
            toggleButton.innerHTML = '<i class="fas fa-filter"></i> Фильтры';
            toggleButton.classList.remove('active');
        }
    }

    applyFilters() {
        this.filters.q = document.getElementById('search-input').value;
        this.filters.gender = document.getElementById('gender-filter').value;
        
        const minAge = document.getElementById('min-age').value;
        const maxAge = document.getElementById('max-age').value;
        
        this.filters.min_age = minAge ? parseInt(minAge) : null;
        this.filters.max_age = maxAge ? parseInt(maxAge) : null;
        
        // Валидация возрастов
        if (this.filters.min_age !== null && this.filters.max_age !== null && 
            this.filters.min_age > this.filters.max_age) {
            this.ui.showNotification('Минимальный возраст не может быть больше максимального', 'error');
            return;
        }
        
        // Сбрасываем и загружаем заново
        this.loadUsers(true);
    }

    resetFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('gender-filter').value = '';
        document.getElementById('min-age').value = '';
        document.getElementById('max-age').value = '';
        
        this.filters = {
            q: '',
            gender: '',
            min_age: null,
            max_age: null
        };
        
        this.loadUsers(true);
    }

    setupInfiniteScroll() {
        let scrollTimeout;
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
                
                // Проверяем, что скролл вниз и достигли низа страницы (с запасом 300px)
                if (scrollTop > lastScrollTop && 
                    scrollTop + clientHeight >= scrollHeight - 300 && 
                    !this.isLoading && 
                    !this.isLoadingMore && 
                    this.hasMore) {
                    this.loadUsers();
                }
                
                lastScrollTop = scrollTop;
            }, 100);
        });
    }
}