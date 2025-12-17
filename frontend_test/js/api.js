// Проверяем, не объявлен ли уже класс API
if (typeof API === 'undefined') {
    class API {
        constructor() {
            this.baseURL = '/api';
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
                            const errorData = await this.parseErrorResponse(retryResponse);
                            throw new Error(errorData);
                        }
                        
                        return await retryResponse.json();
                    }
                }

                if (!response.ok) {
                    const errorData = await this.parseErrorResponse(response);
                    throw new Error(errorData);
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

        async parseErrorResponse(response) {
            try {
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    
                    // Форматируем ошибку в читаемый вид
                    if (errorData.detail) {
                        return errorData.detail;
                    }
                    
                    if (errorData.message) {
                        return errorData.message;
                    }
                    
                    if (Array.isArray(errorData)) {
                        return errorData.map(err => err.msg || JSON.stringify(err)).join(', ');
                    }
                    
                    // Если есть другие поля, преобразуем их
                    const messages = [];
                    for (const key in errorData) {
                        if (Array.isArray(errorData[key])) {
                            messages.push(`${key}: ${errorData[key].join(', ')}`);
                        } else {
                            messages.push(`${key}: ${errorData[key]}`);
                        }
                    }
                    
                    return messages.length > 0 ? messages.join('; ') : JSON.stringify(errorData);
                } else {
                    const text = await response.text();
                    return text || `HTTP error! status: ${response.status}`;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                return `HTTP error! status: ${response.status}`;
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
                    const errorText = await this.parseErrorResponse(response);
                    throw new Error(errorText);
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