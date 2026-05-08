// Проверяем, не объявлен ли уже класс Auth
if (typeof Auth === 'undefined') {
    class Auth {
        constructor() {
            this.api = new API();
            this.ui = new UI();
        }

        async checkAuth() {
            // Проверяем наличие refresh токена
            if (!window.tokenManager.isAuthenticated()) {
                return false;
            }

            try {
                // Пытаемся получить информацию о пользователе
                // Это автоматически обновит access токен если нужно
                const user = await this.api.get('/auth/me');
                window.tokenManager.setUser(user);
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                // Если не удалось, очищаем токены
                window.tokenManager.clearTokens();
                return false;
            }
        }

        async login(email, password) {
            try {
                // Используем skipAuth = true для запросов логина
                const response = await this.api.post('/auth/login', { email, password }, true);
                
                // Сохраняем токены через tokenManager
                window.tokenManager.setTokens(response.access_token, response.refresh_token);

                // Даем небольшой timeout чтобы убедиться что токены установлены
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Получаем информацию о пользователе (уже с авторизацией)
                const user = await this.api.get('/auth/me');
                window.tokenManager.setUser(user);

                this.ui.showNotification('Успешный вход!', 'success');
                return true;
            } catch (error) {
                this.ui.showNotification('Ошибка входа: ' + error.message, 'error');
                return false;
            }
        }

        async quickLogin(email, password) {
            try {
                // Используем skipAuth = true
                const response = await this.api.post('/auth/login', { email, password }, true);
                window.tokenManager.setTokens(response.access_token, response.refresh_token);
                
                // Даем небольшой timeout
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const user = await this.api.get('/auth/me');
                window.tokenManager.setUser(user);
                
                this.ui.showNotification('Быстрый вход выполнен!', 'success');
                return true;
            } catch (error) {
                this.ui.showNotification('Ошибка быстрого входа: ' + error.message, 'error');
                return false;
            }
        }

        async register(username, email, password, passwordConfirm) {
            try {
                // Используем skipAuth = true
                await this.api.post('/auth/register', { 
                    username, 
                    email, 
                    password, 
                    password_confirm: passwordConfirm,
                    is_confirmed: false
                }, true);

                // Возвращаем успех без уведомления
                return true;
            } catch (error) {
                // Возвращаем ошибку без уведомления
                throw error;
            }
        }

        async logout() {
            try {
                // Пытаемся вызвать logout на сервере
                await this.api.post('/auth/logout');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                // Всегда очищаем токены на клиенте
                window.tokenManager.clearTokens();
                window.location.href = 'login.html';
            }
        }

        // Инициализация при загрузке страницы
        async init() {
            // Если есть refresh токен, пытаемся получить access токен
            if (window.tokenManager.isAuthenticated()) {
                try {
                    await window.tokenManager.refreshAccessToken();
                    console.log('Access token refreshed on page load');
                    return true;
                } catch (error) {
                    console.error('Failed to refresh token on page load:', error);
                    return false;
                }
            }
            return false;
        }
    }

    window.Auth = Auth;
}