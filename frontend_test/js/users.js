// Класс для управления страницей пользователей
class UsersPage {
    constructor() {
        this.api = new API();
        this.ui = new UI();
        this.friends = new Friends();
        
        this.currentPage = 0;
        this.pageSize = 20;
        this.hasMore = true;
        this.isLoading = false;
        this.isLoadingMore = false;
        
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
            
            // Для исходящих заявок нужно проверить, какие заявки мы отправили
            // В текущей реализации API нет отдельного эндпоинта для исходящих заявок
            // Будем считать, что если пользователь не в друзьях и не во входящих заявках,
            // то заявку можно отправить
            
        } catch (error) {
            console.error('Error loading friends and requests:', error);
            // Не показываем ошибку пользователю, просто продолжаем
        }
    }

    async loadUsers(reset = false) {
        if (this.isLoading) return;
        
        if (reset) {
            this.currentPage = 0;
            this.hasMore = true;
            this.isLoading = true;
            document.getElementById('users-list').innerHTML = '<div class="loading">Загрузка пользователей...</div>';
            document.getElementById('no-more-results').style.display = 'none';
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
            const total = response.total;
            
            if (reset) {
                document.getElementById('users-list').innerHTML = '';
            }
            
            if (users.length === 0) {
                if (this.currentPage === 0) {
                    document.getElementById('users-list').innerHTML = '<div class="list-item">Пользователи не найдены</div>';
                }
                this.hasMore = false;
                document.getElementById('no-more-results').style.display = 'block';
            } else {
                this.renderUsers(users);
                this.currentPage++;
                
                // Проверяем, есть ли еще пользователи
                if (users.length < this.pageSize || this.currentPage * this.pageSize >= total) {
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
                document.getElementById('users-list').innerHTML = `
                    <div class="error-message">
                        <p>Ошибка загрузки пользователей: ${error.message}</p>
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

    renderUsers(users) {
        const container = document.getElementById('users-list');
        
        users.forEach(user => {
            const userElement = this.createUserCard(user);
            container.appendChild(userElement);
        });
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'list-item user-card';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s ease';
        card.style.marginBottom = '1rem';
        
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 12px var(--shadow)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
        
        // Определяем статус кнопки добавления в друзья
        const isFriend = this.myFriends.includes(user.id);
        const hasIncomingRequest = this.myIncomingRequests.includes(user.id);
        
        let buttonText = 'Добавить в друзья';
        let buttonDisabled = false;
        let buttonClass = 'btn btn-small';
        
        if (isFriend) {
            buttonText = 'Уже друзья';
            buttonDisabled = true;
            buttonClass += ' btn-disabled';
        } else if (hasIncomingRequest) {
            buttonText = 'Принять заявку';
            buttonClass += ' btn-success';
        } else {
            // Проверяем, отправляли ли мы заявку этому пользователю
            // В текущей реализации нет API для исходящих заявок
            // Можно было бы хранить в localStorage, но пока просто показываем кнопку
            buttonText = 'Добавить в друзья';
            buttonClass += ' btn-primary';
        }
        
        // Форматируем возраст
        const ageText = user.age ? `${user.age} лет` : 'Возраст не указан';
        const genderText = user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : 'Не указан';
        
        // Обрезаем био если слишком длинное
        let bioText = user.bio || 'Нет описания';
        if (bioText.length > 150) {
            bioText = bioText.substring(0, 150) + '...';
        }
        
        card.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; gap: 1rem;">
                <div>
                    ${user.avatar_filename ? 
                        `<img src="http://localhost:3001/files/download/avatars/${user.avatar_filename}" 
                              alt="${user.username}" 
                              style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">` :
                        `<div style="width: 60px; height: 60px; border-radius: 50%; background: var(--gradient); 
                                  display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem;">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>`
                    }
                </div>
                <div style="flex: 1;">
                    <div>
                        <strong style="font-size: 1.1rem;">${user.username}</strong>
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">
                            ${genderText} • ${ageText}
                        </div>
                        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                            ${bioText}
                        </div>
                    </div>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="${buttonClass}" 
                        data-user-id="${user.id}"
                        data-username="${user.username}"
                        ${buttonDisabled ? 'disabled' : ''}
                        onclick="event.stopPropagation(); window.usersPage.handleAddFriend(${user.id}, '${user.username.replace(/'/g, "\\'")}')">
                    ${buttonText}
                </button>
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

    async handleAddFriend(userId, username) {
        try {
            // Показываем уведомление о начале отправки
            this.ui.showNotification(`Отправка заявки ${username}...`, 'info');
            
            // Используем существующий функционал из friends.js
            await this.friends.sendFriendRequest(username);
            
            // Обновляем состояние кнопки
            const button = document.querySelector(`button[data-user-id="${userId}"]`);
            if (button) {
                button.textContent = 'Заявка отправлена';
                button.disabled = true;
                button.classList.add('btn-disabled');
                button.classList.remove('btn-primary', 'btn-success');
            }
            
            // Добавляем пользователя в список тех, кому отправили заявку
            if (!this.myFriendRequests.includes(userId)) {
                this.myFriendRequests.push(userId);
            }
            
        } catch (error) {
            console.error('Error sending friend request:', error);
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
            
            // Определяем статус кнопки добавления в друзья для модального окна
            const isFriend = this.myFriends.includes(userDetail.id);
            const hasIncomingRequest = this.myIncomingRequests.includes(userDetail.id);
            
            let buttonText = 'Добавить в друзья';
            let buttonDisabled = false;
            let buttonClass = 'btn';
            
            if (isFriend) {
                buttonText = 'Уже друзья';
                buttonDisabled = true;
                buttonClass += ' btn-disabled';
            } else if (hasIncomingRequest) {
                buttonText = 'Принять заявку';
                buttonClass += ' btn-success';
            } else {
                buttonText = 'Добавить в друзья';
                buttonClass += ' btn-primary';
            }
            
            content.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        ${userDetail.avatar_filename ? 
                            `<img src="http://localhost:3001/files/download/avatars/${userDetail.avatar_filename}" 
                                  alt="${userDetail.username}" 
                                  style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">` :
                            `<div style="width: 120px; height: 120px; border-radius: 50%; background: var(--gradient); 
                                      display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; font-weight: bold;">
                                ${userDetail.username.charAt(0).toUpperCase()}
                            </div>`
                        }
                        <h3 style="margin: 0;">${userDetail.username}</h3>
                    </div>
                    
                    <div style="background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-sm);">
                        <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Информация</h4>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-muted);">Пол</div>
                                <div style="font-weight: 600;">${genderText}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-muted);">Возраст</div>
                                <div style="font-weight: 600;">${ageText}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-muted);">На сайте с</div>
                                <div style="font-weight: 600;">${registeredDate}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-muted);">Видимость профиля</div>
                                <div style="font-weight: 600;">${userDetail.is_visible ? 'Видимый' : 'Скрытый'}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${userDetail.bio ? `
                        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-sm);">
                            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">О себе</h4>
                            <div style="line-height: 1.6; white-space: pre-wrap;">${userDetail.bio}</div>
                        </div>
                    ` : ''}
                    
                    <div>
                        <button class="${buttonClass}" 
                                id="modal-add-friend-btn"
                                data-user-id="${userDetail.id}"
                                data-username="${userDetail.username}"
                                ${buttonDisabled ? 'disabled' : ''}
                                style="width: 100%; padding: 1rem; font-size: 1rem;">
                            ${buttonText}
                        </button>
                    </div>
                </div>
            `;
            
            modal.style.display = 'flex';
            
            // Обработчик для кнопки в модальном окне
            const addFriendBtn = document.getElementById('modal-add-friend-btn');
            if (addFriendBtn && !buttonDisabled) {
                addFriendBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleAddFriend(userDetail.id, userDetail.username);
                    modal.style.display = 'none';
                });
            }
            
            // Закрытие модального окна
            const closeBtn = modal.querySelector('.modal-close');
            const closeModal = () => {
                modal.style.display = 'none';
                // Удаляем обработчики при закрытии
                closeBtn.removeEventListener('click', closeModal);
                modal.removeEventListener('click', handleOverlayClick);
                document.removeEventListener('keydown', handleEscape);
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
            
        } catch (error) {
            console.error('Error loading user details:', error);
            this.ui.showNotification('Ошибка загрузки информации о пользователе: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        // Применение фильтров
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Сброс фильтров
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Поиск при нажатии Enter
        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });
        
        // Автоматический поиск при изменении полей (опционально)
        let searchTimeout;
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.applyFilters();
            }, 500);
        });
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
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
                
                // Проверяем, достигли ли мы низа страницы (с запасом 100px)
                if (scrollTop + clientHeight >= scrollHeight - 100 && 
                    !this.isLoading && 
                    !this.isLoadingMore && 
                    this.hasMore) {
                    this.loadUsers();
                }
            }, 100);
        });
    }
}