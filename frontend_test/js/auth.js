import API from './api.js';
import UI from './ui.js';
import TokenManager from './tokenManager.js';

class Auth {
    constructor() {
        this.api = new API();
        this.ui = new UI();
        this.tokenManager = new TokenManager();
    }

    async checkAuth() {
        if (!this.tokenManager.isAuthenticated()) {
            return false;
        }

        try {
            // Проверяем текущий токен
            const user = await this.api.get('/auth/me');
            return !!user;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    async login(email, password) {
        try {
            const response = await this.api.post('/auth/login', { email, password });

            this.tokenManager.setTokens(response.access_token, response.refresh_token);

            this.ui.showNotification('Успешный вход!', 'success');
            return true;
        } catch (error) {
            this.ui.showNotification('Ошибка входа: ' + error.message, 'error');
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
            this.tokenManager.clearTokens();
            window.location.href = 'login.html';
        }
    }
}

export default Auth;