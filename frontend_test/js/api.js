// Проверяем, не объявлен ли уже класс API
if (typeof API === 'undefined') {
    class API {
        constructor() {
            this.baseURL = '/api';
        }

        async request(endpoint, options = {}, skipAuth = false) {
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

            // Добавляем токен авторизации, если не пропускаем авторизацию
            if (!skipAuth) {
                try {
                    // Получаем валидный access токен (с автообновлением если нужно)
                    const accessToken = await window.tokenManager.getValidAccessToken();
                    if (accessToken) {
                        config.headers.Authorization = `Bearer ${accessToken}`;
                    }
                } catch (error) {
                    console.error('Failed to get valid access token:', error);
                    // Если не удалось получить токен, перенаправляем на логин
                    if (error.message.includes('Не удалось обновить токен') || 
                        error.message.includes('No refresh token available')) {
                        window.tokenManager.clearTokens();
                        window.location.href = 'login.html';
                        return;
                    }
                    throw error;
                }
            }

            try {
                console.log(`Making request to: ${url}`, config);
                
                const response = await fetch(url, config);
                
                // Если получили 401 и это не запрос без авторизации
                if (!skipAuth && response.status === 401) {
                    console.log('Received 401, clearing tokens and redirecting to login');
                    window.tokenManager.clearTokens();
                    window.location.href = 'login.html';
                    return;
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

        async get(endpoint, skipAuth = false) {
            return this.request(endpoint, { method: 'GET' }, skipAuth);
        }

        async post(endpoint, data, skipAuth = false) {
            return this.request(endpoint, {
                method: 'POST',
                body: data
            }, skipAuth);
        }

        async patch(endpoint, data, skipAuth = false) {
            return this.request(endpoint, {
                method: 'PATCH',
                body: data
            }, skipAuth);
        }

        async delete(endpoint, skipAuth = false) {
            return this.request(endpoint, { method: 'DELETE' }, skipAuth);
        }

        async uploadFile(file, bucket = 'proofs') {
            const formData = new FormData();
            formData.append('file', file);

            try {
                // Получаем валидный access токен
                const accessToken = await window.tokenManager.getValidAccessToken();
                
                const response = await fetch(`${this.baseURL}/files/upload?bucket=${bucket}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
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