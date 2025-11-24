import TokenManager from './tokenManager.js';

class API {
    constructor() {
        this.baseURL = 'http://localhost:3001';
        this.tokenManager = new TokenManager();
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Добавляем токен авторизации
        const accessToken = this.tokenManager.getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        try {
            const response = await fetch(url, config);
            
            // Если токен просрочен, пробуем обновить
            if (response.status === 401 && this.tokenManager.getRefreshToken()) {
                await this.refreshToken();
                
                // Повторяем запрос с новым токеном
                config.headers.Authorization = `Bearer ${this.tokenManager.getAccessToken()}`;
                const retryResponse = await fetch(url, config);
                
                if (!retryResponse.ok) {
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                }
                
                return await retryResponse.json();
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async refreshToken() {
        try {
            const refreshToken = this.tokenManager.getRefreshToken();
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            this.tokenManager.setTokens(data.access_token, refreshToken); // refresh token остается тем же
            
            return true;
        } catch (error) {
            this.tokenManager.clearTokens();
            throw new Error('Не удалось обновить токен');
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Специальный метод для загрузки файлов
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseURL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.tokenManager.getAccessToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        return await response.json();
    }
}

export default API;