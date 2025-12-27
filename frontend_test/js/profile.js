// Проверяем, не объявлен ли уже класс Profile
if (typeof Profile === 'undefined') {
    class Profile {
        constructor() {
            this.api = new API();
            this.ui = new UI();
            this.currentUser = null;
            this.avatarInfo = null;
            this.isLoading = false;
            this.isInitialized = false;
        }

        async loadProfile() {
            if (this.isLoading) {
                console.log('Profile is already loading');
                return;
            }
            
            this.isLoading = true;
            console.log('Loading profile...');
            
            try {
                // Загружаем информацию о пользователе
                const user = await this.api.get('/auth/me');
                this.currentUser = user;
                console.log('User loaded:', user);
                
                // Загружаем информацию об аватарке
                await this.loadAvatarInfo();
                
                // Рендерим все компоненты
                this.renderProfileStatus(user);
                this.renderProfileForm(user);
                this.renderAvatar();
                
                // Показываем контент
                document.getElementById('profile-content').style.display = 'block';
                document.getElementById('profile-status').style.display = 'none';
                
                // Настраиваем обработчики только один раз
                if (!this.isInitialized) {
                    this.setupEventListeners();
                    this.isInitialized = true;
                }
                
            } catch (error) {
                console.error('Error loading profile:', error);
                this.ui.showNotification('Ошибка загрузки профиля: ' + error.message, 'error');
                
                // Если ошибка авторизации, перенаправляем на логин
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                }
            } finally {
                this.isLoading = false;
            }
        }

        async loadAvatarInfo() {
            try {
                console.log('Loading avatar info...');
                this.avatarInfo = await this.api.get('/profile/avatar');
                console.log('Avatar info:', this.avatarInfo);
            } catch (error) {
                console.error('Error loading avatar info:', error);
                this.avatarInfo = { has_avatar: false };
            }
        }

        renderProfileStatus(user) {
            const container = document.getElementById('profile-status');
            if (!container) return;

            let statusHTML = '<div class="status-cards">';
            
            statusHTML += `
                <div class="status-card">
                    <div class="status-title">Статус аккаунта</div>
                    <div class="status-value ${user.role === 'admin' ? 'status-admin' : 'status-user'}">
                        ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                    </div>
                </div>
                
                <div class="status-card">
                    <div class="status-title">Email подтвержден</div>
                    <div class="status-value ${user.is_confirmed ? 'status-confirmed' : 'status-unconfirmed'}">
                        ${user.is_confirmed ? '✅ Да' : '❌ Нет'}
                    </div>
                </div>
                
                <div class="status-card">
                    <div class="status-title">Дата регистрации</div>
                    <div class="status-value">
                        ${new Date(user.created_at).toLocaleDateString()}
                    </div>
                </div>
            `;
            
            if (user.email && !user.is_confirmed) {
                statusHTML += `
                    <div class="status-card status-warning" style="grid-column: span 2;">
                        <div class="status-title">⚠️ Требуется подтверждение</div>
                        <div class="status-value" style="color: #f59e0b;">
                            Подтвердите email для полного доступа
                        </div>
                    </div>
                `;
            }
            
            statusHTML += '</div>';
            container.innerHTML = statusHTML;
        }

        renderProfileForm(user) {
            // Заполняем форму данными пользователя
            document.getElementById('username').value = user.username || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('gender').value = user.gender || '';
            document.getElementById('bio').value = user.bio || '';
            
            // Форматируем дату рождения
            if (user.birth_date) {
                const birthDate = new Date(user.birth_date);
                const formattedDate = birthDate.toISOString().split('T')[0];
                document.getElementById('birth_date').value = formattedDate;
            } else {
                document.getElementById('birth_date').value = '';
            }
            
            document.getElementById('is_visible').checked = user.is_visible !== false;
            
            // Показываем статус email
            this.updateEmailStatus(user);
        }

        updateEmailStatus(user) {
            const emailStatus = document.getElementById('email-status');
            if (!emailStatus) return;

            if (user.is_confirmed) {
                emailStatus.innerHTML = '<span style="color: #10b981;">✅ Email подтвержден</span>';
            } else {
                emailStatus.innerHTML = '<span style="color: #f59e0b;">⚠️ Email не подтвержден. Проверьте почту или измените email</span>';
            }
        }

        renderAvatar() {
            const container = document.getElementById('avatar-container');
            if (!container) return;

            if (this.avatarInfo && this.avatarInfo.has_avatar && this.avatarInfo.avatar_filename) {
                const avatarUrl = `http://localhost:3001/files/download/avatars/${this.avatarInfo.avatar_filename}`;
                
                container.innerHTML = `
                    <div class="avatar-section">
                        <div class="avatar-preview">
                            <img src="${avatarUrl}" alt="Аватар" class="avatar-image avatar-clickable"
                                onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.username)}&background=6366f1&color=fff&size=150'">
                        </div>
                        <div class="avatar-actions">
                            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                                Ваша аватарка будет отображаться в вашем профиле и на карточках пользователей. Нажмите на аватарку для просмотра в полном размере.
                            </p>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <input type="file" id="avatar-file" accept="image/jpeg,image/png,image/gif,image/webp" style="display: none;">
                                <label for="avatar-file" class="btn btn-small" style="cursor: pointer;">
                                    <i class="fas fa-upload"></i> Выбрать файл
                                </label>
                                <button id="upload-avatar-btn" class="btn btn-success btn-small">
                                    <i class="fas fa-cloud-upload-alt"></i> Загрузить
                                </button>
                                <button id="delete-avatar-btn" class="btn btn-danger btn-small">
                                    <i class="fas fa-trash"></i> Удалить
                                </button>
                            </div>
                            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                                Форматы: JPEG, PNG, GIF, WebP<br>Максимальный размер: 5MB
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const placeholderInitial = this.currentUser.username.charAt(0).toUpperCase();
                
                container.innerHTML = `
                    <div class="avatar-section">
                        <div class="avatar-preview">
                            <div class="avatar-placeholder avatar-clickable" onclick="window.avatarViewer.showAvatar('https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.username)}&background=6366f1&color=fff&size=400')">
                                ${placeholderInitial}
                            </div>
                        </div>
                        <div class="avatar-actions">
                            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                                Добавьте аватарку, чтобы другие пользователи могли вас лучше узнать. Нажмите на аватарку для просмотра в полном размере. Рекомендуем грузить квадратную фотку. Так ваша карточка будет привлекательнее
                            </p>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <input type="file" id="avatar-file" accept="image/jpeg,image/png,image/gif,image/webp" style="display: none;">
                                <label for="avatar-file" class="btn btn-small" style="cursor: pointer;">
                                    <i class="fas fa-upload"></i> Выбрать файл
                                </label>
                                <button id="upload-avatar-btn" class="btn btn-success btn-small">
                                    <i class="fas fa-cloud-upload-alt"></i> Загрузить
                                </button>
                            </div>
                            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                                Форматы: JPEG, PNG, GIF, WebP<br>Максимальный размер: 5MB
                            </div>
                        </div>
                    </div>
                `;
            }

            // Настраиваем обработчики для аватарки
            this.setupAvatarHandlers();
        }

        setupAvatarHandlers() {
            const fileInput = document.getElementById('avatar-file');
            const uploadBtn = document.getElementById('upload-avatar-btn');
            const deleteBtn = document.getElementById('delete-avatar-btn');

            if (fileInput && uploadBtn) {
                // Удаляем старые обработчики
                const newFileInput = fileInput.cloneNode(true);
                fileInput.parentNode.replaceChild(newFileInput, fileInput);
                
                const newUploadBtn = uploadBtn.cloneNode(true);
                uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);

                // Новые обработчики
                newFileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        newUploadBtn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Загрузить: ${e.target.files[0].name}`;
                    }
                });

                newUploadBtn.addEventListener('click', async () => {
                    if (!newFileInput.files || newFileInput.files.length === 0) {
                        this.ui.showNotification('Выберите файл для загрузки', 'error');
                        return;
                    }

                    const file = newFileInput.files[0];
                    const maxSize = 5 * 1024 * 1024;
                    
                    if (file.size > maxSize) {
                        this.ui.showNotification('Файл слишком большой. Максимальный размер: 5MB', 'error');
                        return;
                    }

                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    if (!allowedTypes.includes(file.type)) {
                        this.ui.showNotification('Недопустимый тип файла. Разрешены: JPEG, PNG, GIF, WebP', 'error');
                        return;
                    }

                    try {
                        this.ui.showNotification('Загрузка аватарки...', 'info');
                        
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch('http://localhost:3001/profile/avatar', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${window.tokenManager.getAccessToken()}`
                            },
                            body: formData
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(errorText);
                        }

                        await response.json();
                        this.ui.showNotification('Аватарка успешно загружена!', 'success');
                        
                        // Обновляем информацию об аватарке
                        await this.loadAvatarInfo();
                        this.renderAvatar();
                        
                        // Сбрасываем input
                        newFileInput.value = '';
                        newUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Загрузить';
                        
                    } catch (error) {
                        this.ui.showNotification('Ошибка загрузки аватарки: ' + error.message, 'error');
                    }
                });
            }

            if (deleteBtn) {
                const newDeleteBtn = deleteBtn.cloneNode(true);
                deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

                newDeleteBtn.addEventListener('click', async () => {
                    const confirmed = await Modal.confirm('Вы уверены, что хотите удалить аватарку?');
                    if (!confirmed) return;

                    try {
                        await this.api.delete('/profile/avatar');
                        this.ui.showNotification('Аватарка удалена', 'success');
                        
                        // Обновляем информацию об аватарке
                        await this.loadAvatarInfo();
                        this.renderAvatar();
                    } catch (error) {
                        this.ui.showNotification('Ошибка удаления аватарки: ' + error.message, 'error');
                    }
                });
            }
        }

        setupEventListeners() {
            // Форма редактирования профиля
            const profileForm = document.getElementById('profile-form');
            if (profileForm) {
                profileForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateProfile();
                });
            }

            // Форма смены пароля
            const passwordForm = document.getElementById('password-form');
            if (passwordForm) {
                passwordForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.changePassword();
                });
            }
        }

        async updateProfile() {
            if (this.isLoading) return;
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const gender = document.getElementById('gender').value;
            const bio = document.getElementById('bio').value;
            const birthDate = document.getElementById('birth_date').value;
            const isVisible = document.getElementById('is_visible').checked;

            // Проверяем изменения
            const updateData = {};
            if (username !== this.currentUser.username) updateData.username = username;
            if (email !== this.currentUser.email) updateData.email = email;
            if (gender !== this.currentUser.gender) updateData.gender = gender || null;
            if (bio !== this.currentUser.bio) updateData.bio = bio || null;
            
            if (birthDate) {
                const dateObj = new Date(birthDate);
                if (!this.currentUser.birth_date || dateObj.toISOString() !== new Date(this.currentUser.birth_date).toISOString()) {
                    updateData.birth_date = dateObj.toISOString();
                }
            } else if (this.currentUser.birth_date) {
                updateData.birth_date = null;
            }
            
            if (isVisible !== this.currentUser.is_visible) {
                updateData.is_visible = isVisible;
            }

            if (Object.keys(updateData).length === 0) {
                this.ui.showNotification('Нет изменений для сохранения', 'info');
                return;
            }

            try {
                this.isLoading = true;
                const saveBtn = document.getElementById('save-profile-btn');
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
                saveBtn.disabled = true;
                
                await this.api.patch('/profile', updateData);
                this.ui.showNotification('Профиль успешно обновлен!', 'success');
                
                // Обновляем данные пользователя
                const user = await this.api.get('/auth/me');
                this.currentUser = user;
                this.renderProfileForm(user);
                this.updateEmailStatus(user);
                
            } catch (error) {
                this.ui.showNotification('Ошибка обновления профиля: ' + error.message, 'error');
            } finally {
                this.isLoading = false;
                const saveBtn = document.getElementById('save-profile-btn');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
                saveBtn.disabled = false;
            }
        }

        async changePassword() {
            if (this.isLoading) return;
            
            const currentPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const newPasswordConfirm = document.getElementById('new_password_confirm').value;

            if (newPassword.length < 6) {
                this.ui.showNotification('Новый пароль должен содержать минимум 6 символов', 'error');
                return;
            }
            
            if (newPassword !== newPasswordConfirm) {
                this.ui.showNotification('Пароли не совпадают', 'error');
                return;
            }

            const passwordData = {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirm: newPasswordConfirm
            };

            try {
                this.isLoading = true;
                const changeBtn = document.getElementById('change-password-btn');
                const originalText = changeBtn.innerHTML;
                changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Смена пароля...';
                changeBtn.disabled = true;
                
                await this.api.patch('/profile/password', passwordData);
                this.ui.showNotification('Пароль успешно изменен!', 'success');
                
                // Очищаем форму
                document.getElementById('password-form').reset();
                
            } catch (error) {
                this.ui.showNotification('Ошибка смены пароля: ' + error.message, 'error');
            } finally {
                this.isLoading = false;
                const changeBtn = document.getElementById('change-password-btn');
                changeBtn.innerHTML = '<i class="fas fa-key"></i> Сменить пароль';
                changeBtn.disabled = false;
            }
        }
    }

    window.Profile = Profile;
}