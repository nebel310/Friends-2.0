// Проверяем, не объявлен ли уже класс Friends
if (typeof Friends === 'undefined') {
    class Friends {
        constructor() {
            this.api = new API();
            this.ui = new UI();
            // Используем глобальный tokenManager
        }

        async loadFriendsList() {
            try {
                const friends = await this.api.get('/friends/?limit=100&offset=0');
                this.renderFriendsList(friends);
            } catch (error) {
                this.ui.showNotification('Ошибка загрузки списка друзей: ' + error.message, 'error');
            }
        }

        renderFriendsList(friends) {
            const container = document.getElementById('friends-list');
            
            if (!friends || friends.length === 0) {
                container.innerHTML = '<div class="list-item">У вас пока нет друзей</div>';
                return;
            }

            container.innerHTML = friends.map(friend => `
                <div class="list-item">
                    <div>
                        <strong>${friend.username}</strong>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-danger btn-small" onclick="friends.removeFriend(${friend.friendship_id})">
                            Удалить
                        </button>
                    </div>
                </div>
            `).join('');
        }

        async loadFriendRequests() {
            try {
                const requests = await this.api.get('/friends/get_requests');
                this.renderFriendRequests(requests);
                this.updateRequestsCounter(requests);
            } catch (error) {
                this.ui.showNotification('Ошибка загрузки заявок: ' + error.message, 'error');
            }
        }

        renderFriendRequests(requests) {
            const container = document.getElementById('incoming-requests');
            
            if (!requests || requests.length === 0) {
                container.innerHTML = '<div class="list-item">У вас нет входящих заявок</div>';
                return;
            }

            container.innerHTML = requests.map(request => `
                <div class="list-item">
                    <div>
                        <strong>${request.username}</strong> отправил(а) вам заявку в друзья
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-success btn-small" onclick="friends.acceptFriendRequest(${request.id})">
                            Принять
                        </button>
                        <button class="btn btn-danger btn-small" onclick="friends.rejectFriendRequest(${request.id})">
                            Отклонить
                        </button>
                    </div>
                </div>
            `).join('');
        }

        async updateRequestsCounter(requests = null) {
            try {
                if (!requests) {
                    requests = await this.api.get('/friends/get_requests');
                }
                
                const counterElement = document.getElementById('requests-counter');
                if (counterElement) {
                    if (requests && requests.length > 0) {
                        counterElement.textContent = requests.length;
                        counterElement.style.display = 'flex';
                    } else {
                        counterElement.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error updating requests counter:', error);
            }
        }

        async sendFriendRequest(usernameOrEmail) {
            try {
                await this.api.post('/friends/send_requests', {
                    username_or_email: usernameOrEmail
                });
                this.ui.showNotification('Заявка отправлена!', 'success');
                // Обновляем счетчик после отправки заявки
                await this.updateRequestsCounter();
            } catch (error) {
                this.ui.showNotification('Ошибка отправки заявки: ' + error.message, 'error');
            }
        }

        async acceptFriendRequest(friendshipId) {
            try {
                await this.api.patch(`/friends/requests/${friendshipId}/accept`);
                this.ui.showNotification('Заявка принята!', 'success');
                await this.loadFriendRequests();
            } catch (error) {
                this.ui.showNotification('Ошибка принятия заявки: ' + error.message, 'error');
            }
        }

        async rejectFriendRequest(friendshipId) {
            try {
                await this.api.delete(`/friends/requests/${friendshipId}/delete`);
                this.ui.showNotification('Заявка отклонена', 'success');
                await this.loadFriendRequests();
            } catch (error) {
                this.ui.showNotification('Ошибка отклонения заявки: ' + error.message, 'error');
            }
        }

        async removeFriend(friendshipId) {
            const confirmed = await Modal.confirm('Вы уверены, что хотите удалить друга?');
            if (!confirmed) {
                return;
            }

            try {
                await this.api.delete(`/friends/requests/${friendshipId}/delete`);
                this.ui.showNotification('Друг удален', 'success');
                await this.loadFriendsList();
            } catch (error) {
                this.ui.showNotification('Ошибка удаления друга: ' + error.message, 'error');
            }
        }

        async loadOutgoingRequests() {
            try {
                // Получаем всех друзей
                const friends = await this.api.get('/friends/?limit=1000&offset=0');
                const friendIds = friends.map(f => f.id);
                
                // Получаем входящие заявки
                const incomingRequests = await this.api.get('/friends/get_requests');
                const incomingIds = incomingRequests.map(req => req.user_id);
                
                // В текущей реализации API нет отдельного эндпоинта для исходящих заявок
                // Возвращаем данные, которые у нас есть
                return {
                    friends: friendIds,
                    incoming: incomingIds,
                    outgoing: [] // Пока пустой массив
                };
            } catch (error) {
                console.error('Error loading outgoing requests:', error);
                return { friends: [], incoming: [], outgoing: [] };
            }
        }
    }

    // Создаем глобальный экземпляр
    window.friends = new Friends();
    window.Friends = Friends;
}