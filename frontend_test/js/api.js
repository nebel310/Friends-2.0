// Проверяем, не объявлен ли уже класс API
if (typeof API === 'undefined') {
    class API {
        constructor() {
            this.baseURL = 'http://localhost:3001';
            // Используем глобальный tokenManager вместо создания нового
        }

        async request(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;
            
            // Базовая конфигурация
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            // Добавляем тело запроса, если оно есть и метод не GET
            if (options.body && config.method !== 'GET') {
                config.body = JSON.stringify(options.body);
            }

            // Добавляем токен авторизации из глобального tokenManager
            const accessToken = window.tokenManager.getAccessToken();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }

            try {
                console.log(`Making request to: ${url}`, config);
                
                const response = await fetch(url, config);
                
                // Если токен просрочен, пробуем обновить
                if (response.status === 401 && window.tokenManager.getRefreshToken()) {
                    console.log('Token expired, attempting refresh...');
                    const refreshSuccess = await this.refreshToken();
                    
                    if (refreshSuccess) {
                        // Повторяем запрос с новым токеном
                        config.headers.Authorization = `Bearer ${window.tokenManager.getAccessToken()}`;
                        const retryResponse = await fetch(url, config);
                        
                        if (!retryResponse.ok) {
                            const errorText = await retryResponse.text();
                            throw new Error(errorText || `HTTP error! status: ${retryResponse.status}`);
                        }
                        
                        return await retryResponse.json();
                    }
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `HTTP error! status: ${response.status}`);
                }

                // Для ответов без контента
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            } catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        }

        async refreshToken() {
            try {
                const refreshToken = window.tokenManager.getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

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
                window.tokenManager.setTokens(data.access_token, refreshToken);
                
                console.log('Token refreshed successfully');
                return true;
            } catch (error) {
                console.error('Token refresh failed:', error);
                window.tokenManager.clearTokens();
                throw new Error('Не удалось обновить токен');
            }
        }

        async get(endpoint) {
            return this.request(endpoint, { method: 'GET' });
        }

        async post(endpoint, data) {
            return this.request(endpoint, {
                method: 'POST',
                body: data
            });
        }

        async patch(endpoint, data) {
            return this.request(endpoint, {
                method: 'PATCH',
                body: data
            });
        }

        async delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        }

        async uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${this.baseURL}/files/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.tokenManager.getAccessToken()}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `Upload failed: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('File upload failed:', error);
                throw error;
            }
        }
    }

    window.API = API;
}