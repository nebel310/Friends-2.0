// Проверяем, не объявлен ли уже класс Admin
if (typeof Admin === 'undefined') {
    class Admin {
        constructor() {
            this.api = new API();
            this.ui = new UI();
            this.currentUser = window.tokenManager.getUser();
            this.allUsers = [];
            this.bannedUsers = [];
            this.selectedUser = null;
        }

        async loadAllUsers() {
            try {
                console.log('Loading all users...');
                
                // Загружаем пользователей с фильтрами
                const showBanned = document.getElementById('show-banned')?.checked ?? true;
                const showInvisible = document.getElementById('show-invisible')?.checked ?? true;
                
                let url = `/admin/users?include_banned=${showBanned}&include_invisible=${showInvisible}`;
                
                const users = await this.api.get(url);
                this.allUsers = users;
                
                console.log('Users loaded:', users.length);
                this.renderUsersList(users);
                
            } catch (error) {
                console.error('Error loading users:', error);
                this.ui.showNotification('Ошибка загрузки пользователей: ' + error.message, 'error');
            }
        }

        async loadBannedUsers() {
            try {
                console.log('Loading banned users...');
                
                const bannedUsers = await this.api.get('/admin/users/banned');
                this.bannedUsers = bannedUsers;
                
                console.log('Banned users loaded:', bannedUsers.length);
                this.renderBannedUsersList(bannedUsers);
                
            } catch (error) {
                console.error('Error loading banned users:', error);
                this.ui.showNotification('Ошибка загрузки забаненных пользователей: ' + error.message, 'error');
            }
        }

        async loadPlatformStats() {
            try {
                // Загружаем всех пользователей для статистики
                const allUsers = await this.api.get('/admin/users?include_banned=true&include_invisible=true');
                
                // Считаем статистику
                const stats = {
                    total: allUsers.length,
                    admins: allUsers.filter(u => u.role === 'admin').length,
                    banned: allUsers.filter(u => u.role === 'banned').length,
                    active: allUsers.filter(u => u.role === 'user' && u.is_visible).length,
                    hidden: allUsers.filter(u => !u.is_visible).length,
                    confirmed: allUsers.filter(u => u.is_confirmed).length,
                    unconfirmed: allUsers.filter(u => !u.is_confirmed).length
                };
                
                this.renderPlatformStats(stats);
                
            } catch (error) {
                console.error('Error loading platform stats:', error);
                this.renderPlatformStats({
                    total: 0,
                    admins: 0,
                    banned: 0,
                    active: 0,
                    hidden: 0,
                    confirmed: 0,
                    unconfirmed: 0
                });
            }
        }

        renderUsersList(users) {
            const container = document.getElementById('users-list');
            if (!container) return;

            if (!users || users.length === 0) {
                container.innerHTML = '<div class="list-item">Пользователи не найдены</div>';
                return;
            }

            // Применяем поисковый фильтр если есть
            const searchTerm = document.getElementById('search-users')?.value?.toLowerCase() || '';
            let filteredUsers = users;
            
            if (searchTerm) {
                filteredUsers = users.filter(user => 
                    user.username.toLowerCase().includes(searchTerm) || 
                    user.email.toLowerCase().includes(searchTerm)
                );
            }

            if (filteredUsers.length === 0) {
                container.innerHTML = '<div class="list-item">По вашему запросу ничего не найдено</div>';
                return;
            }

            const usersHTML = filteredUsers.map(user => {
                const roleColor = this.getRoleColor(user.role);
                const statusText = user.is_visible ? 'Видимый' : 'Скрытый';
                const confirmedText = user.is_confirmed ? 'Подтвержден' : 'Не подтвержден';
                const confirmedColor = user.is_confirmed ? '#10b981' : '#ef4444';
                
                return `
                    <div class="list-item user-item" data-user-id="${user.id}">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div>
                                    <strong>${user.username}</strong>
                                    <div style="font-size: 0.9rem; color: #666;">${user.email}</div>
                                </div>
                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <span class="role-badge" style="background: ${roleColor}">${this.getRoleText(user.role)}</span>
                                    <span class="status-badge">${statusText}</span>
                                    <span class="status-badge" style="color: ${confirmedColor}; border-color: ${confirmedColor}">
                                        ${confirmedText}
                                    </span>
                                </div>
                            </div>
                            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                                ID: ${user.id} • Зарегистрирован: ${new Date(user.created_at).toLocaleDateString()}
                                ${user.gender ? ` • Пол: ${user.gender === 'male' ? 'Мужской' : 'Женский'}` : ''}
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn btn-small change-role-btn" data-user-id="${user.id}">
                                Изменить роль
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = usersHTML;
            
            // Добавляем обработчики для кнопок изменения роли
            this.setupRoleChangeButtons();
        }

        renderBannedUsersList(users) {
            const container = document.getElementById('banned-users-list');
            if (!container) return;

            if (!users || users.length === 0) {
                container.innerHTML = '<div class="list-item">Забаненных пользователей нет</div>';
                return;
            }

            const usersHTML = users.map(user => {
                const confirmedText = user.is_confirmed ? 'Подтвержден' : 'Не подтвержден';
                const confirmedColor = user.is_confirmed ? '#10b981' : '#ef4444';
                
                return `
                    <div class="list-item user-item" data-user-id="${user.id}">
                        <div style="flex: 1;">
                            <div><strong>${user.username}</strong></div>
                            <div style="font-size: 0.9rem; color: #666;">${user.email}</div>
                            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                                ID: ${user.id} • Заблокирован: ${new Date(user.created_at).toLocaleDateString()}
                                <span style="margin-left: 1rem; color: ${confirmedColor}">${confirmedText}</span>
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn btn-small change-role-btn" data-user-id="${user.id}">
                                Разбанить
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = usersHTML;
            
            // Добавляем обработчики для кнопок изменения роли
            this.setupRoleChangeButtons();
        }

        renderPlatformStats(stats) {
            const container = document.getElementById('platform-stats');
            if (!container) return;

            const statsHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-title">Всего пользователей</div>
                        <div class="stat-value">${stats.total}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Администраторов</div>
                        <div class="stat-value">${stats.admins}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Забаненных</div>
                        <div class="stat-value">${stats.banned}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Активных</div>
                        <div class="stat-value">${stats.active}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Скрытых</div>
                        <div class="stat-value">${stats.hidden}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Подтвержденных</div>
                        <div class="stat-value">${stats.confirmed}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Не подтвержденных</div>
                        <div class="stat-value">${stats.unconfirmed}</div>
                    </div>
                </div>
            `;

            container.innerHTML = statsHTML;
        }

        getRoleColor(role) {
            switch(role) {
                case 'admin': return '#8b5cf6';
                case 'banned': return '#ef4444';
                default: return '#10b981';
            }
        }

        getRoleText(role) {
            switch(role) {
                case 'admin': return 'Администратор';
                case 'banned': return 'Забанен';
                default: return 'Пользователь';
            }
        }

        setupNavigation() {
            const navButtons = document.querySelectorAll('.admin-nav-btn');
            const tabs = document.querySelectorAll('.admin-tab');
            
            navButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tabId = button.getAttribute('data-tab');
                    
                    // Обновляем активную кнопку
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Показываем активную вкладку
                    tabs.forEach(tab => {
                        tab.classList.remove('active');
                        if (tab.id === `${tabId}-tab`) {
                            tab.classList.add('active');
                        }
                    });
                });
            });
        }

        setupFilters() {
            // Кнопка обновления
            const refreshBtn = document.getElementById('refresh-users');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadAllUsers();
                    this.loadBannedUsers();
                    this.loadPlatformStats();
                });
            }

            // Фильтр поиска
            const searchInput = document.getElementById('search-users');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    this.renderUsersList(this.allUsers);
                });
            }

            // Фильтр забаненных
            const showBanned = document.getElementById('show-banned');
            if (showBanned) {
                showBanned.addEventListener('change', () => {
                    this.loadAllUsers();
                });
            }

            // Фильтр скрытых
            const showInvisible = document.getElementById('show-invisible');
            if (showInvisible) {
                showInvisible.addEventListener('change', () => {
                    this.loadAllUsers();
                });
            }
        }

        setupRoleChangeButtons() {
            const buttons = document.querySelectorAll('.change-role-btn');
            buttons.forEach(button => {
                // Удаляем старые обработчики
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                newButton.addEventListener('click', (e) => {
                    const userId = parseInt(newButton.getAttribute('data-user-id'));
                    const user = [...this.allUsers, ...this.bannedUsers].find(u => u.id === userId);
                    
                    if (user) {
                        this.showRoleChangeModal(user);
                    }
                });
            });
        }

        setupModalHandlers() {
            const modal = document.getElementById('change-role-modal');
            const closeBtn = modal.querySelector('.modal-close');
            const cancelBtn = document.getElementById('cancel-role-change');
            const confirmBtn = document.getElementById('confirm-role-change');
            const roleSelect = document.getElementById('new-role');

            // Закрытие модального окна
            const closeModal = () => {
                modal.style.display = 'none';
                this.selectedUser = null;
            };

            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);

            // Клик вне модального окна
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Изменение роли
            confirmBtn.addEventListener('click', async () => {
                if (!this.selectedUser) return;

                const newRole = roleSelect.value;
                
                try {
                    await this.changeUserRole(this.selectedUser.id, newRole);
                    closeModal();
                    
                    // Обновляем списки
                    await this.loadAllUsers();
                    await this.loadBannedUsers();
                    await this.loadPlatformStats();
                    
                } catch (error) {
                    console.error('Error changing role:', error);
                }
            });

            // Обновление предупреждения при выборе роли
            roleSelect.addEventListener('change', () => {
                this.updateRoleWarning();
            });
        }

        showRoleChangeModal(user) {
            this.selectedUser = user;
            
            const modal = document.getElementById('change-role-modal');
            const userInfo = document.getElementById('user-info');
            const roleSelect = document.getElementById('new-role');
            
            // Заполняем информацию о пользователе
            userInfo.innerHTML = `
                <p>Пользователь: <strong>${user.username}</strong> (${user.email})</p>
                <p>Текущая роль: <span class="role-badge" style="background: ${this.getRoleColor(user.role)}">
                    ${this.getRoleText(user.role)}
                </span></p>
            `;
            
            // Устанавливаем текущую роль в селект
            roleSelect.value = user.role;
            
            // Обновляем предупреждение
            this.updateRoleWarning();
            
            // Показываем модальное окно
            modal.style.display = 'flex';
        }

        updateRoleWarning() {
            const warningDiv = document.getElementById('role-warning');
            const newRole = document.getElementById('new-role').value;
            
            if (this.selectedUser.id === this.currentUser.id) {
                warningDiv.innerHTML = `
                    <div style="color: #ef4444; font-weight: 600;">
                        ⚠️ Вы пытаетесь изменить свою собственную роль!
                    </div>
                `;
                warningDiv.style.display = 'block';
                
                // Блокируем кнопку подтверждения
                document.getElementById('confirm-role-change').disabled = true;
            } else if (this.selectedUser.role === newRole) {
                warningDiv.innerHTML = `
                    <div style="color: #f59e0b;">
                        ⚠️ Пользователь уже имеет эту роль
                    </div>
                `;
                warningDiv.style.display = 'block';
                
                // Блокируем кнопку подтверждения
                document.getElementById('confirm-role-change').disabled = true;
            } else {
                warningDiv.style.display = 'none';
                document.getElementById('confirm-role-change').disabled = false;
            }
        }

        async changeUserRole(userId, newRole) {
            try {
                this.ui.showNotification('Изменение роли...', 'info');
                
                await this.api.post(`/admin/users/${userId}/role`, { role: newRole });
                
                this.ui.showNotification(`Роль пользователя успешно изменена на "${this.getRoleText(newRole)}"`, 'success');
                
            } catch (error) {
                this.ui.showNotification('Ошибка изменения роли: ' + error.message, 'error');
                throw error;
            }
        }
    }

    window.Admin = Admin;
}