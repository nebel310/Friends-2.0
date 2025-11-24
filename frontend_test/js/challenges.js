// Проверяем, не объявлен ли уже класс Challenges
if (typeof Challenges === 'undefined') {
    class Challenges {
        constructor() {
            this.api = new API();
            this.ui = new UI();
            this.tokenManager = new TokenManager();
        }

        async loadFriendsForFilter() {
            try {
                const friends = await this.api.get('/friends/?limit=100&offset=0');
                const select = document.getElementById('friendship-filter');
                
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
            const currentUser = this.tokenManager.getUser();
            
            if (!challenges || challenges.length === 0) {
                container.innerHTML = '<div class="list-item">Челленджей не найдено</div>';
                return;
            }

            const filteredChallenges = challenges.filter(challenge => {
                const isCreator = challenge.created_by.id === currentUser.id;
                const isForCurrentUser = !isCreator;
                
                if (isCreator) return true;
                
                if (isForCurrentUser) {
                    return ['pending', 'accepted', 'completed'].includes(challenge.status);
                }
                
                return false;
            });

            if (filteredChallenges.length === 0) {
                container.innerHTML = '<div class="list-item">Челленджей не найдено</div>';
                return;
            }

            container.innerHTML = filteredChallenges.map(challenge => {
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
                'completed': 'Ожидает проверки',
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
                this.renderChallengeDetail(challenge);
            } catch (error) {
                this.ui.showNotification('Ошибка загрузки деталей челленджа: ' + error.message, 'error');
            }
        }

        renderChallengeDetail(challenge) {
            const container = document.getElementById('challenge-detail');
            const currentUser = this.tokenManager.getUser();
            const isCreator = challenge.created_by.id === currentUser.id;
            
            container.innerHTML = `
                <div class="section">
                    <h2>${challenge.title}</h2>
                    <div style="margin-bottom: 1rem;">
                        <strong>Статус:</strong> <span class="challenge-status status-${challenge.status}">${this.getStatusText(challenge.status)}</span>
                    </div>
                    ${challenge.description ? `<div style="margin-bottom: 1rem;"><strong>Описание:</strong> ${challenge.description}</div>` : ''}
                    <div style="margin-bottom: 1rem;">
                        <strong>${isCreator ? 'Для друга:' : 'От:'}</strong> ${isCreator ? 'Вы создали этот челлендж' : challenge.created_by.username}
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>Дата создания:</strong> ${new Date(challenge.created_at).toLocaleString()}
                    </div>
                    ${challenge.completed_at ? `<div style="margin-bottom: 1rem;"><strong>Завершен:</strong> ${new Date(challenge.completed_at).toLocaleString()}</div>` : ''}
                </div>

                ${this.renderProofsSection(challenge, isCreator)}

                ${this.renderReviewSection(challenge, isCreator)}

                ${this.renderActionsSection(challenge, isCreator)}
            `;

            this.addActionHandlers(challenge.id, isCreator);
        }

        renderProofsSection(challenge, isCreator) {
            const hasProofs = challenge.proofs && challenge.proofs.length > 0;
            
            let proofsHTML = '';
            if (hasProofs) {
                proofsHTML = challenge.proofs.map(proof => `
                    <div class="list-item">
                        <div>
                            <strong>${proof.file_type === 'image' ? '🖼️ Изображение' : '🎥 Видео'}</strong>
                            <div><a href="${proof.file_url}" target="_blank">${proof.file_url}</a></div>
                        </div>
                        ${!isCreator && (challenge.status === 'accepted' || challenge.status === 'completed') ? `
                            <div>
                                <button class="btn btn-danger btn-small" onclick="challenges.deleteProof(${proof.id})">Удалить</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                proofsHTML = '<div class="list-item">Доказательств пока нет</div>';
            }

            const showUploadForm = !isCreator && (challenge.status === 'accepted' || challenge.status === 'completed');

            return `
                <div class="section">
                    <h3>Доказательства выполнения</h3>
                    <div id="proofs-list">
                        ${proofsHTML}
                    </div>
                    ${showUploadForm ? this.renderUploadForm() : ''}
                </div>
            `;
        }

        renderUploadForm() {
            return `
                <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                    <h4>Добавить доказательство</h4>
                    <form id="upload-proof-form">
                        <div class="form-group">
                            <label for="proof-url">URL файла:</label>
                            <input type="url" id="proof-url" name="proof-url" required placeholder="https://example.com/proof.jpg">
                        </div>
                        <div class="form-group">
                            <label for="proof-type">Тип файла:</label>
                            <select id="proof-type" name="proof-type" required>
                                <option value="image">Изображение</option>
                                <option value="video">Видео</option>
                            </select>
                        </div>
                        <button type="submit" class="btn">Добавить доказательство</button>
                    </form>
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                        Поддерживаемые форматы: JPEG, PNG, GIF, MP4, AVI, MOV
                    </div>
                </div>
            `;
        }

        renderReviewSection(challenge, isCreator) {
            if (challenge.review) {
                return `
                    <div class="section">
                        <h3>Результат проверки</h3>
                        <div>
                            <strong>Статус:</strong> ${challenge.review.approved ? '✅ Принято' : '❌ Отклонено'}
                        </div>
                        ${challenge.review.comment ? `<div><strong>Комментарий:</strong> ${challenge.review.comment}</div>` : ''}
                        <div>
                            <strong>Дата проверки:</strong> ${new Date(challenge.review.reviewed_at).toLocaleString()}
                        </div>
                    </div>
                `;
            }

            if (isCreator && challenge.status === 'completed') {
                return `
                    <div class="section">
                        <h3>Модерация</h3>
                        <div>Челлендж ожидает вашей проверки</div>
                        <div style="margin-top: 1rem;">
                            <button id="approve-btn" class="btn btn-success">Принять выполнение</button>
                            <button id="reject-btn" class="btn btn-danger">Отклонить выполнение</button>
                        </div>
                        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                            При отклонении все доказательства будут удалены, и челлендж вернется в статус "В процессе выполнения"
                        </div>
                    </div>
                `;
            }

            return '';
        }

        renderActionsSection(challenge, isCreator) {
            let actions = '';

            if (isCreator) {
                if (challenge.status === 'pending') {
                    actions = `
                        <div class="section">
                            <h3>Действия</h3>
                            <button id="delete-challenge-btn" class="btn btn-danger">Удалить челлендж</button>
                        </div>
                    `;
                }
            } else {
                if (challenge.status === 'pending') {
                    actions = `
                        <div class="section">
                            <h3>Действия</h3>
                            <button id="accept-challenge-btn" class="btn btn-success">Принять челлендж</button>
                            <button id="reject-challenge-btn" class="btn btn-danger">Отклонить челлендж</button>
                        </div>
                    `;
                } else if (challenge.status === 'accepted') {
                    actions = `
                        <div class="section">
                            <h3>Действия</h3>
                            <button id="complete-challenge-btn" class="btn">Отправить на проверку</button>
                            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                                Перед отправкой на проверку добавьте хотя бы одно доказательство
                            </div>
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
                    await this.deleteChallenge(challengeId);
                });
            }

            const acceptBtn = document.getElementById('accept-challenge-btn');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', async () => {
                    await this.acceptChallenge(challengeId);
                });
            }

            const rejectBtn = document.getElementById('reject-challenge-btn');
            if (rejectBtn) {
                rejectBtn.addEventListener('click', async () => {
                    await this.rejectChallenge(challengeId);
                });
            }

            const completeBtn = document.getElementById('complete-challenge-btn');
            if (completeBtn) {
                completeBtn.addEventListener('click', async () => {
                    await this.completeChallenge(challengeId);
                });
            }

            const uploadForm = document.getElementById('upload-proof-form');
            if (uploadForm) {
                uploadForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const fileUrl = formData.get('proof-url');
                    const fileType = formData.get('proof-type');
                    
                    await this.addProof(challengeId, fileUrl, fileType);
                    e.target.reset();
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
                rejectReviewBtn.addEventListener('click', async () => {
                    await this.createReview(challengeId, false);
                });
            }
        }

        async deleteChallenge(challengeId) {
            if (!confirm('Вы уверены, что хотите удалить этот челлендж?')) {
                return;
            }

            try {
                await this.api.post(`/challenges/${challengeId}/reject`);
                this.ui.showNotification('Челлендж удален', 'success');
                window.location.href = 'challenges.html';
            } catch (error) {
                this.ui.showNotification('Ошибка удаления челленджа: ' + error.message, 'error');
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

        async rejectChallenge(challengeId) {
            if (!confirm('Вы уверены, что хотите отклонить этот челлендж?')) {
                return;
            }

            try {
                await this.api.post(`/challenges/${challengeId}/reject`);
                this.ui.showNotification('Челлендж отклонен', 'success');
                window.location.href = 'challenges.html';
            } catch (error) {
                this.ui.showNotification('Ошибка отклонения челленджа: ' + error.message, 'error');
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
                await this.api.post(`/challenges/${challengeId}/proofs`, {
                    file_url: fileUrl,
                    file_type: fileType
                });
                this.ui.showNotification('Доказательство добавлено!', 'success');
                await this.loadChallengeDetail(challengeId);
            } catch (error) {
                this.ui.showNotification('Ошибка добавления доказательства: ' + error.message, 'error');
            }
        }

        async deleteProof(proofId) {
            if (!confirm('Вы уверены, что хотите удалить доказательство?')) {
                return;
            }

            try {
                await this.api.delete(`/proofs/${proofId}`);
                this.ui.showNotification('Доказательство удалено', 'success');
                window.location.reload();
            } catch (error) {
                this.ui.showNotification('Ошибка удаления доказательства: ' + error.message, 'error');
            }
        }

        async createReview(challengeId, approved) {
            const comment = approved ? 
                'Отличная работа! Челлендж выполнен успешно.' : 
                'К сожалению, доказательства недостаточны. Попробуйте еще раз.';

            try {
                await this.api.post(`/challenges/${challengeId}/review`, {
                    approved: approved,
                    comment: comment
                });

                if (approved) {
                    this.ui.showNotification('Челлендж принят! Задание завершено.', 'success');
                } else {
                    this.ui.showNotification('Выполнение отклонено. Челлендж возвращен на доработку.', 'success');
                    
                    const challenge = await this.api.get(`/challenges/${challengeId}`);
                    if (challenge.proofs && challenge.proofs.length > 0) {
                        for (const proof of challenge.proofs) {
                            await this.api.delete(`/proofs/${proof.id}`);
                        }
                    }
                }
                
                await this.loadChallengeDetail(challengeId);
            } catch (error) {
                this.ui.showNotification('Ошибка модерации: ' + error.message, 'error');
            }
        }
    }

    // Создаем глобальный экземпляр
    window.challenges = new Challenges();
    window.Challenges = Challenges;
}