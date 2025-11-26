console.log("rabotay blyat")
if (typeof TokenManager === 'undefined') {
    class TokenManager {
        constructor() {
            this.tokens = {
                accessToken: localStorage.getItem('accessToken'),
                refreshToken: localStorage.getItem('refreshToken')
            };
            
            try {
                const userData = localStorage.getItem('user');
                this.user = userData ? JSON.parse(userData) : null;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.user = null;
            }
        }

        getAccessToken() {
            return this.tokens.accessToken;
        }

        getRefreshToken() {
            return this.tokens.refreshToken;
        }

        setTokens(accessToken, refreshToken) {
            try {
                this.tokens.accessToken = accessToken;
                this.tokens.refreshToken = refreshToken;
                
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
            } catch (error) {
                console.error('Error saving tokens:', error);
            }
        }

        setUser(user) {
            try {
                this.user = user;
                localStorage.setItem('user', JSON.stringify(user));
            } catch (error) {
                console.error('Error saving user data:', error);
            }
        }

        getUser() {
            return this.user;
        }

        clearTokens() {
            try {
                this.tokens = { accessToken: null, refreshToken: null };
                this.user = null;
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            } catch (error) {
                console.error('Error clearing tokens:', error);
            }
        }

        isAuthenticated() {
            return !!this.tokens.accessToken;
        }

        // Проверяет, не истек ли токен (базовая проверка)
        isTokenExpired() {
            const token = this.getAccessToken();
            if (!token) return true;

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.exp * 1000 < Date.now();
            } catch (error) {
                console.error('Error checking token expiry:', error);
                return true;
            }
        }
    }

    // Создаем глобальный экземпляр
    window.tokenManager = new TokenManager();
}