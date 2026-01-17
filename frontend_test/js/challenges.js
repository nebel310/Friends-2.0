// Проверяем, не объявлен ли уже класс Challenges
if (typeof Challenges === 'undefined') {
    class Challenges {
        constructor() {
            this.api = new API();
            this.ui = new UI();
            // Используем глобальный tokenManager
        }

        async loadFriendsForFilter() {
            try {
                const friends = await this.api.get('/friends/?limit=100&offset=0');
                const select = document.getElementById('friendship-filter');
                
                // Очищаем существующие опции кроме первой
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                friends.forEach(friend => {
                    const option = document.createElement('option');
                    option.value = friend.friendship_id;
                    option.textContent = friend.username;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading friends for filter:', error);
            }
        }

        async loadFriendsForChallengeCreation() {
            try {
                const friends = await this.api.get('/friends/?limit=100&offset=0');
                const select = document.getElementById('friendship');
                
                // Очищаем существующие опции кроме первой
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                friends.forEach(friend => {
                    const option = document.createElement('option');
                    option.value = friend.friendship_id;
                    option.textContent = friend.username;
                    select.appendChild(option);
                });
            } catch (error) {
                this.ui.showNotification('Ошибка загрузки списка друзей: ' + error.message, 'error');
            }
        }

        async loadChallenges(friendshipId = null, status = null) {
            try {
                let url = '/challenges';
                const params = [];
                
                if (friendshipId) params.push(`friendship_id=${friendshipId}`);
                if (status) params.push(`status=${status}`);
                
                if (params.length > 0) {
                    url += '?' + params.join('&');
                }

                const challenges = await this.api.get(url);
                this.renderChallengesList(challenges);
            } catch (error) {
                this.ui.showNotification('Ошибка загрузки челленджей: ' + error.message, 'error');
            }
        }

        renderChallengesList(challenges) {
            const container = document.getElementById('challenges-list');
            const currentUser = window.tokenManager.getUser();
            
            if (!challenges || challenges.length === 0) {
                container.innerHTML = '<div class="list-item">Челленджей не найдено</div>';
                return;
            }

            container.innerHTML = challenges.map(challenge => {
                const isCreator = challenge.created_by.id === currentUser.id;
                return `
                    <div class="list-item">
                        <div style="flex: 1;">
                            <div><strong>${challenge.title}</strong></div>
                            <div style="font-size: 0.9rem; color: #666;">
                                Статус: ${this.getStatusText(challenge.status)} | 
                                ${isCreator ? 'Для:' : 'От:'} ${isCreator ? 'вашего друга' : challenge.created_by.username} |
                                Дата: ${new Date(challenge.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <a href="challenge-detail.html?id=${challenge.id}" class="btn btn-small">Подробнее</a>
                        </div>
                    </div>
                `;
            }).join('');
        }

        getStatusText(status) {
            const statusMap = {
                'pending': 'Ожидает принятия',
                'accepted': 'В процессе выполнения',
                'completed': 'На проверке',
                'approved': 'Завершен',
                'rejected': 'Отклонен'
            };
            return statusMap[status] || status;
        }

        async createChallenge(friendshipId, title, description) {
            try {
                await this.api.post('/challenges', {
                    friendship_id: friendshipId,
                    title: title,
                    description: description || null
                });

                this.ui.showNotification('Челлендж успешно создан!', 'success');
                return true;
            } catch (error) {
                this.ui.showNotification('Ошибка создания челленджа: ' + error.message, 'error');
                return false;
            }
        }

        async loadChallengeDetail(challengeId) {
            try {
                const challenge = await this.api.get(`/challenges/${challengeId}`);
                // Загружаем историю модераций
                let moderationHistory = [];
                try {
                    const reviewsResponse = await this.api.get(`/reviews/challenges/${challengeId}?limit=100&offset=0`);
                    moderationHistory = reviewsResponse.reviews || [];
                } catch (error) {
                    console.error('Error loading moderation history:', error);
                    moderationHistory = [];
                }
                
                this.renderChallengeDetail(challenge, moderationHistory);
            } catch (error) {
                this.ui.showNotification('Ошибка загрузки деталей челленджа: ' + error.message, 'error');
            }
        }

        renderChallengeDetail(challenge, moderationHistory = []) {
            const container = document.getElementById('challenge-detail');
            const currentUser = window.tokenManager.getUser();
            const isCreator = challenge.created_by.id === currentUser.id;
            
            container.innerHTML = `
                <div class="section">
                    <h2>${challenge.title}</h2>
                    <div style="margin-bottom: 1rem;">
                        <strong>Статус:</strong> <span class="challenge-status status-${challenge.status}">${this.getStatusText(challenge.status)}</span>
                    </div>
                    ${challenge.description ? `
                        <div style="margin-bottom: 1rem;">
                            <strong>Описание:</strong>
                            <div class="description-wrapper">${challenge.description}</div>
                        </div>
                    ` : ''}
                    <div style="margin-bottom: 1rem;" class="text-overflow-fix">
                        <strong>${isCreator ? 'Для друга:' : 'От:'}</strong> ${isCreator ? 'Вы создали этот челлендж' : challenge.created_by.username}
                    </div>
                    <div style="margin-bottom: 1rem;" class="text-overflow-fix">
                        <strong>Дата создания:</strong> ${new Date(challenge.created_at).toLocaleString()}
                    </div>
                    ${challenge.completed_at ? `<div style="margin-bottom: 1rem;" class="text-overflow-fix"><strong>Завершен:</strong> ${new Date(challenge.completed_at).toLocaleString()}</div>` : ''}
                </div>

                ${this.renderProofsSection(challenge, isCreator)}

                ${this.renderModerationSection(challenge, moderationHistory, isCreator)}

                ${this.renderActionsSection(challenge, isCreator)}
            `;

            this.addActionHandlers(challenge.id, isCreator);
        }

        renderProofsSection(challenge, isCreator) {
            const hasProofs = challenge.proofs && challenge.proofs.length > 0;
            
            let proofsHTML = '';
            if (hasProofs) {
                proofsHTML = challenge.proofs.map(proof => {
                    // Получаем имя файла из URL
                    const fileName = proof.file_url.split('/').pop();
                    const fileUrl = `http://194.156.117.39:3001/files/download/${fileName}`;
                    
                    let mediaElement = '';
                    if (proof.file_type === 'image') {
                        mediaElement = `
                            <div style="margin-top: 0.5rem;">
                                <img src="${fileUrl}" alt="Доказательство" style="max-width: 300px; max-height: 300px; border-radius: 4px; border: 1px solid #ddd;">
                            </div>
                        `;
                    } else if (proof.file_type === 'video') {
                        mediaElement = `
                            <div style="margin-top: 0.5rem;">
                                <video controls style="max-width: 300px; max-height: 300px; border-radius: 4px; border: 1px solid #ddd;">
                                    <source src="${fileUrl}" type="video/mp4">
                                    Ваш браузер не поддерживает видео тег.
                                </video>
                            </div>
                        `;
                    }

                    // ФИКС: Скрываем кнопку удаления proof если статус completed или approved
                    const canDeleteProof = !isCreator && 
                        (challenge.status === 'accepted' || challenge.status === 'rejected');

                    return `
                        <div class="list-item">
                            <div style="flex: 1;">
                                <div>
                                    <strong>${proof.file_type === 'image' ? '🖼️ Изображение' : '🎥 Видео'}</strong>
                                </div>
                                ${mediaElement}
                                <div style="margin-top: 0.5rem;">
                                    <a href="${fileUrl}" download="${fileName}" class="btn btn-small">Скачать оригинал</a>
                                </div>
                            </div>
                            ${canDeleteProof ? `
                                <div>
                                    <button class="btn btn-danger btn-small" data-proof-id="${proof.id}" data-challenge-id="${challenge.id}">Удалить</button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            } else {
                proofsHTML = '<div class="list-item">Доказательств пока нет</div>';
            }

            // Показываем форму загрузки ТОЛЬКО для исполнителя и ТОЛЬКО в подходящих статусах
            const showUploadForm = !isCreator && 
                (challenge.status === 'accepted' || challenge.status === 'rejected');

            return `
                <div class="section">
                    <h3>Доказательства выполнения</h3>
                    <div id="proofs-list">
                        ${proofsHTML}
                    </div>
                    ${showUploadForm ? this.renderUploadForm(challenge.status) : ''}
                </div>
            `;
        }

        renderUploadForm(challengeStatus) {
            return `
                <div class="file-upload-container">
                    <h4>Добавить доказательство</h4>
                    <form id="upload-proof-form" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="proof-file">Выберите файл:</label>
                            <input type="file" id="proof-file" name="proof-file" accept="image/jpeg,image/png,video/mp4" required>
                        </div>
                        <button type="submit" class="btn">Загрузить и добавить доказательство</button>
                    </form>
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                        Поддерживаемые форматы: JPEG, PNG (изображения), MP4 (видео). Максимальный размер: 10MB
                    </div>
                    ${challengeStatus === 'rejected' ? `
                        <div style="margin-top: 0.5rem; color: #e74c3c; font-size: 0.9rem;">
                            💡 После добавления новых доказательств вы можете отправить челлендж на повторную проверку
                        </div>
                    ` : ''}
                </div>
            `;
        }

        renderModerationSection(challenge, moderationHistory, isCreator) {
            let moderationHTML = '';

            // История модераций
            if (moderationHistory && moderationHistory.length > 0) {
                moderationHTML += `
                    <div class="section">
                        <h3>История модераций</h3>
                        ${moderationHistory.map(review => `
                            <div class="list-item" style="margin-bottom: 1rem; padding: 1rem; border-left: 4px solid ${review.approved ? '#27ae60' : '#e74c3c'};">
                                <div><strong>${review.approved ? '✅ Принято' : '❌ Отклонено'}</strong></div>
                                ${review.comment ? `
                                    <div style="margin-top: 0.5rem;">
                                        <strong>Комментарий:</strong>
                                        <div class="comment-wrapper" style="border-left-color: ${review.approved ? '#27ae60' : '#e74c3c'}">
                                            ${review.comment}
                                        </div>
                                    </div>
                                ` : ''}
                                <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                                    Проверено: ${new Date(review.reviewed_at).toLocaleString()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Форма модерации для создателя
            if (isCreator && challenge.status === 'completed') {
                moderationHTML += `
                    <div class="section">
                        <h3>Модерация</h3>
                        <div>Челлендж ожидает вашей проверки</div>
                        <div style="margin-top: 1rem;">
                            <button id="approve-btn" class="btn btn-success">Принять выполнение</button>
                            <button id="reject-btn" class="btn btn-danger">Отклонить выполнение</button>
                        </div>
                        <div id="reject-comment-container" style="margin-top: 1rem; display: none;">
                            <label for="reject-comment">Комментарий к отклонению:</label>
                            <textarea id="reject-comment" rows="3" style="width: 100%; margin-top: 0.5rem;" placeholder="Укажите причину отклонения..."></textarea>
                        </div>
                    </div>
                `;
            }

            return moderationHTML;
        }

        renderActionsSection(challenge, isCreator) {
            let actions = '';

            if (isCreator) {
                // Создатель может удалить челлендж в любом статусе
                actions = `
                    <div class="section">
                        <h3>Действия</h3>
                        <button id="delete-challenge-btn" class="btn btn-danger">Удалить челлендж</button>
                    </div>
                `;
            } else {
                // Для пользователя, который выполняет челлендж
                if (challenge.status === 'pending') {
                    actions = `
                        <div class="section">
                            <h3>Действия</h3>
                            <button id="accept-challenge-btn" class="btn btn-success">Принять челлендж</button>
                            <button id="delete-challenge-btn" class="btn btn-danger">Удалить челлендж</button>
                        </div>
                    `;
                } else if (challenge.status === 'accepted' || challenge.status === 'rejected') {
                    // Показываем кнопку завершения, если есть хотя бы одно доказательство
                    const hasProofs = challenge.proofs && challenge.proofs.length > 0;
                    const buttonText = challenge.status === 'rejected' ? 'Отправить на повторную проверку' : 'Отправить на проверку';
                    
                    actions = `
                        <div class="section">
                            <h3>Действия</h3>
                            <button id="complete-challenge-btn" class="btn" ${!hasProofs ? 'disabled' : ''}>
                                ${buttonText}
                            </button>
                            ${!hasProofs ? `
                                <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                                    Для отправки на проверку необходимо добавить хотя бы одно доказательство
                                </div>
                            ` : ''}
                            ${challenge.status === 'rejected' && hasProofs ? `
                                <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #27ae60;">
                                    💡 Добавьте новые доказательства и отправьте на повторную проверку
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
            }

            return actions;
        }

        addActionHandlers(challengeId, isCreator) {
            const deleteBtn = document.getElementById('delete-challenge-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    await this.deleteChallenge(challengeId, isCreator);
                });
            }

            const acceptBtn = document.getElementById('accept-challenge-btn');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', async () => {
                    await this.acceptChallenge(challengeId);
                });
            }

            const completeBtn = document.getElementById('complete-challenge-btn');
            if (completeBtn) {
                completeBtn.addEventListener('click', async () => {
                    await this.completeChallenge(challengeId);
                });
            }

            // Обработчики для кнопок удаления proof
            const proofDeleteButtons = document.querySelectorAll('[data-proof-id]');
            proofDeleteButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    const proofId = button.getAttribute('data-proof-id');
                    const challengeId = button.getAttribute('data-challenge-id');
                    await this.deleteProof(proofId, challengeId);
                });
            });

            const uploadForm = document.getElementById('upload-proof-form');
            if (uploadForm) {
                uploadForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const fileInput = document.getElementById('proof-file');
                    const file = fileInput.files[0];

                    if (!file) {
                        this.ui.showNotification('Выберите файл', 'error');
                        return;
                    }

                    // Проверка размера файла (10MB)
                    const maxSize = 10 * 1024 * 1024;
                    if (file.size > maxSize) {
                        this.ui.showNotification('Файл слишком большой. Максимальный размер: 10MB', 'error');
                        return;
                    }

                    // Проверка типа файла
                    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
                    if (!allowedTypes.includes(file.type)) {
                        this.ui.showNotification('Недопустимый тип файла. Разрешены: JPEG, PNG, MP4', 'error');
                        return;
                    }

                    try {
                        this.ui.showNotification('Загрузка файла...', 'info');
                        
                        // Загружаем файл на сервер
                        const uploadResult = await this.api.uploadFile(file);
                        
                        // Определяем тип файла
                        const fileType = file.type.startsWith('image') ? 'image' : 'video';
                        
                        // Создаем proof с полученным URL
                        await this.addProof(challengeId, uploadResult.file_url, fileType);
                        
                        fileInput.value = ''; // Очищаем поле выбора файла
                    } catch (error) {
                        this.ui.showNotification('Ошибка загрузки файла: ' + error.message, 'error');
                    }
                });
            }

            const approveBtn = document.getElementById('approve-btn');
            if (approveBtn) {
                approveBtn.addEventListener('click', async () => {
                    await this.createReview(challengeId, true);
                });
            }

            const rejectReviewBtn = document.getElementById('reject-btn');
            if (rejectReviewBtn) {
                let showComment = false;
                rejectReviewBtn.addEventListener('click', () => {
                    if (!showComment) {
                        document.getElementById('reject-comment-container').style.display = 'block';
                        rejectReviewBtn.textContent = 'Подтвердить отклонение';
                        showComment = true;
                    } else {
                        const comment = document.getElementById('reject-comment').value;
                        this.createReview(challengeId, false, comment);
                    }
                });
            }
        }

        async deleteChallenge(challengeId, isCreator) {
            const confirmed = await Modal.confirm('Вы уверены, что хотите удалить этот челлендж?');
            if (!confirmed) {
                return;
            }

            try {
                // Используем новый эндпоинт удаления
                await this.api.delete(`/challenges/${challengeId}`);
                this.ui.showNotification('Челлендж удален', 'success');
                window.location.href = 'challenges.html';
            } catch (error) {
                console.error('Delete challenge error:', error);
                this.ui.showNotification('Ошибка удаления челленджа: ' + error.message, 'error');
            }
        }

        async deleteProof(proofId, challengeId) {
            const confirmed = await Modal.confirm('Вы уверены, что хотите удалить доказательство?');
            if (!confirmed) {
                return;
            }

            try {
                // Используем правильный endpoint для удаления proof
                await this.api.delete(`/challenges/${challengeId}/proofs/${proofId}`);
                this.ui.showNotification('Доказательство удалено', 'success');
                
                // Перезагружаем детали челленджа чтобы обновить интерфейс
                await this.loadChallengeDetail(challengeId);
            } catch (error) {
                console.error('Delete proof error:', error);
                this.ui.showNotification('Ошибка удаления доказательства: ' + error.message, 'error');
            }
        }

        async acceptChallenge(challengeId) {
            try {
                await this.api.post(`/challenges/${challengeId}/accept`);
                this.ui.showNotification('Челлендж принят! Теперь вы можете его выполнять.', 'success');
                await this.loadChallengeDetail(challengeId);
            } catch (error) {
                this.ui.showNotification('Ошибка принятия челленджа: ' + error.message, 'error');
            }
        }

        async completeChallenge(challengeId) {
            try {
                const challenge = await this.api.get(`/challenges/${challengeId}`);
                if (!challenge.proofs || challenge.proofs.length === 0) {
                    this.ui.showNotification('Добавьте хотя бы одно доказательство перед отправкой на проверку', 'error');
                    return;
                }

                await this.api.post(`/challenges/${challengeId}/complete`);
                this.ui.showNotification('Челлендж отправлен на проверку!', 'success');
                await this.loadChallengeDetail(challengeId);
            } catch (error) {
                this.ui.showNotification('Ошибка завершения челленджа: ' + error.message, 'error');
            }
        }

        async addProof(challengeId, fileUrl, fileType) {
            try {
                // Используем новый эндпоинт для множественной загрузки
                await this.api.post(`/challenges/${challengeId}/proofs`, [
                    {
                        file_url: fileUrl,
                        file_type: fileType
                    }
                ]);
                this.ui.showNotification('Доказательство добавлено!', 'success');
                await this.loadChallengeDetail(challengeId);
            } catch (error) {
                this.ui.showNotification('Ошибка добавления доказательства: ' + error.message, 'error');
            }
        }

        async deleteExistingReview(challengeId) {
            try {
                // Получаем все ревью для этого челленджа
                const reviewsResponse = await this.api.get(`/reviews/challenges/${challengeId}?limit=100&offset=0`);
                const reviews = reviewsResponse.reviews || [];
                
                // Удаляем все существующие ревью
                for (const review of reviews) {
                    await this.api.delete(`/reviews/${review.id}`);
                }
                
                return reviews.length; // Возвращаем количество удаленных ревью
            } catch (error) {
                console.error('Error deleting existing reviews:', error);
                throw new Error('Не удалось удалить предыдущие ревью');
            }
        }

        async createReview(challengeId, approved, comment = null) {
            try {
                // Сначала пытаемся создать ревью
                await this.api.post(`/reviews/challenges/${challengeId}`, {
                    approved: approved,
                    comment: comment || (approved ? 
                        'Отличная работа! Челлендж выполнен успешно.' : 
                        'К сожалению, доказательства недостаточны. Попробуйте еще раз.')
                });

                if (approved) {
                    this.ui.showNotification('Челлендж принят! Задание завершено.', 'success');
                } else {
                    this.ui.showNotification('Выполнение отклонено. Челлендж возвращен на доработку.', 'success');
                }
                
                await this.loadChallengeDetail(challengeId);
            } catch (error) {
                // Если ревью уже существует, удаляем его и создаем заново
                if (error.message.includes('Ревью для этого челленджа уже существует')) {
                    try {
                        this.ui.showNotification('Обновление результата проверки...', 'info');
                        
                        // Удаляем существующее ревью
                        await this.deleteExistingReview(challengeId);
                        
                        // Создаем новое ревью
                        await this.api.post(`/reviews/challenges/${challengeId}`, {
                            approved: approved,
                            comment: comment || (approved ? 
                                'Отличная работа! Челлендж выполнен успешно.' : 
                                'К сожалению, доказательства недостаточны. Попробуйте еще раз.')
                        });

                        if (approved) {
                            this.ui.showNotification('Челлендж принят! Задание завершено.', 'success');
                        } else {
                            this.ui.showNotification('Выполнение отклонено. Челлендж возвращен на доработку.', 'success');
                        }
                        
                        await this.loadChallengeDetail(challengeId);
                    } catch (secondError) {
                        this.ui.showNotification('Ошибка обновления модерации: ' + secondError.message, 'error');
                    }
                } else {
                    this.ui.showNotification('Ошибка модерации: ' + error.message, 'error');
                }
            }
        }

        async downloadFile(fileName) {
            try {
                const response = await fetch(`${this.api.baseURL}/files/download/${fileName}`);
                if (!response.ok) {
                    throw new Error('File not found');
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                this.ui.showNotification('Ошибка скачивания файла: ' + error.message, 'error');
            }
        }
    }

    // Создаем глобальный экземпляр
    window.challenges = new Challenges();
    window.Challenges = Challenges;
}