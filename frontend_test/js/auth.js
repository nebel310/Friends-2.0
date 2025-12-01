// Проверяем, не объявлен ли уже класс Auth
if (typeof Auth === 'undefined') {
    class Auth {
        constructor() {
            this.api = new API();
            this.ui = new UI();
            // Используем глобальный tokenManager вместо создания нового
        }

        async checkAuth() {
            if (!window.tokenManager.isAuthenticated()) {
                return false;
            }

            try {
                const user = await this.api.get('/auth/me');
                window.tokenManager.setUser(user);
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                window.tokenManager.clearTokens();
                return false;
            }
        }

        async login(email, password) {
            try {
                const response = await this.api.post('/auth/login', { email, password });
                window.tokenManager.setTokens(response.access_token, response.refresh_token);

                // Даем небольшой timeout чтобы убедиться что токены установлены
                await new Promise(resolve => setTimeout(resolve, 100));
                
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
                const response = await this.api.post('/auth/login', { email, password });
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
                await this.api.post('/auth/register', { 
                    username, 
                    email, 
                    password, 
                    password_confirm: passwordConfirm 
                });

                this.ui.showNotification('Регистрация успешна! Подтвердите email.', 'success');
                return true;
            } catch (error) {
                this.ui.showNotification('Ошибка регистрации: ' + error.message, 'error');
                return false;
            }
        }

        async logout() {
            try {
                await this.api.post('/auth/logout');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                window.tokenManager.clearTokens();
                window.location.href = 'login.html';
            }
        }
    }

    window.Auth = Auth;
}