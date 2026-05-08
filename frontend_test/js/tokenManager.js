console.log("rabotay blyat")
if (typeof TokenManager === 'undefined') {
    class TokenManager {
        constructor() {
            // Храним только refresh токен в localStorage
            this.refreshToken = localStorage.getItem('refreshToken');
            
            // Access токен храним в памяти, НЕ в localStorage
            this.accessToken = null;
            
            // Данные пользователя
            try {
                const userData = localStorage.getItem('user');
                this.user = userData ? JSON.parse(userData) : null;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.user = null;
            }
        }

        getAccessToken() {
            return this.accessToken;
        }

        getRefreshToken() {
            return this.refreshToken;
        }

        setTokens(accessToken, refreshToken) {
            try {
                // Access токен храним только в памяти
                this.accessToken = accessToken;
                
                // Refresh токен сохраняем в localStorage
                if (refreshToken) {
                    this.refreshToken = refreshToken;
                    localStorage.setItem('refreshToken', refreshToken);
                }
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
                // Очищаем оба токена
                this.accessToken = null;
                this.refreshToken = null;
                this.user = null;
                
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            } catch (error) {
                console.error('Error clearing tokens:', error);
            }
        }

        isAuthenticated() {
            // Проверяем только наличие refresh токена
            return !!this.refreshToken;
        }

        // Получаем новый access токен с помощью refresh токена
        async refreshAccessToken() {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            try {
                // Согласно схеме бекенда, refresh_token передается в query string
                const response = await fetch(`/api/auth/refresh?refresh_token=${encodeURIComponent(this.refreshToken)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                    // Тело запроса пустое, так как refresh_token в query
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                    throw new Error(errorData.detail || 'Failed to refresh token');
                }

                const data = await response.json();
                
                // Сохраняем новый access токен в памяти
                this.accessToken = data.access_token;
                
                // Если сервер вернул новый refresh токен, сохраняем его
                if (data.refresh_token) {
                    this.refreshToken = data.refresh_token;
                    localStorage.setItem('refreshToken', data.refresh_token);
                }
                
                console.log('Access token refreshed successfully');
                return this.accessToken;
                
            } catch (error) {
                console.error('Token refresh failed:', error);
                this.clearTokens();
                throw new Error('Не удалось обновить токен: ' + error.message);
            }
        }

        // Проверяем, истек ли access токен
        isAccessTokenExpired() {
            if (!this.accessToken) return true;

            try {
                const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
                return payload.exp * 1000 < Date.now();
            } catch (error) {
                console.error('Error checking token expiry:', error);
                return true;
            }
        }

        // Метод для получения валидного access токена (с автообновлением при необходимости)
        async getValidAccessToken() {
            // Если нет access токена или он истек
            if (!this.accessToken || this.isAccessTokenExpired()) {
                console.log('Access token expired or missing, refreshing...');
                await this.refreshAccessToken();
            }
            return this.accessToken;
        }
    }

    // Создаем глобальный экземпляр
    window.tokenManager = new TokenManager();
}