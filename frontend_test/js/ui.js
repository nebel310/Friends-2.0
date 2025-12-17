// Проверяем, не объявлен ли уже класс UI
if (typeof UI === 'undefined') {
    class UI {
        constructor() {}

        extractMessageFromError(error) {
            // Если ошибка уже строка, пытаемся распарсить JSON
            if (typeof error === 'string') {
                try {
                    // Пробуем распарсить как JSON
                    const parsed = JSON.parse(error);
                    
                    // Если это объект с detail (стандартный формат FastAPI)
                    if (parsed.detail) {
                        return parsed.detail;
                    }
                    
                    // Если это объект с message
                    if (parsed.message) {
                        return parsed.message;
                    }
                    
                    // Если это объект с error
                    if (parsed.error) {
                        return parsed.error;
                    }
                    
                    // Если это массив ошибок (например, валидация)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const firstError = parsed[0];
                        if (firstError && firstError.msg) {
                            return firstError.msg;
                        }
                        return parsed.join(', ');
                    }
                    
                    // Если это просто объект, преобразуем в читаемую строку
                    if (typeof parsed === 'object') {
                        const messages = [];
                        for (const key in parsed) {
                            if (Array.isArray(parsed[key])) {
                                messages.push(`${key}: ${parsed[key].join(', ')}`);
                            } else {
                                messages.push(`${key}: ${parsed[key]}`);
                            }
                        }
                        return messages.join('; ');
                    }
                    
                    // Если ничего не подошло, возвращаем как есть
                    return error;
                    
                } catch (e) {
                    // Если это не JSON, возвращаем как есть
                    return this.cleanErrorMessage(error);
                }
            }
            
            // Если это объект Error
            if (error instanceof Error) {
                return this.cleanErrorMessage(error.message);
            }
            
            // Если это объект с полями
            if (error && typeof error === 'object') {
                // Стандартный формат FastAPI
                if (error.detail) {
                    return error.detail;
                }
                
                // Другие форматы
                if (error.message) {
                    return this.cleanErrorMessage(error.message);
                }
                
                if (error.error) {
                    return error.error;
                }
                
                // Если это объект ответа от fetch
                if (error.status && error.statusText) {
                    return `HTTP ${error.status}: ${error.statusText}`;
                }
                
                // Преобразуем объект в строку
                try {
                    return JSON.stringify(error);
                } catch (e) {
                    return String(error);
                }
            }
            
            // По умолчанию преобразуем в строку
            return this.cleanErrorMessage(String(error));
        }

        cleanErrorMessage(message) {
            // Убираем лишние символы и форматы
            let cleaned = message;
            
            // Убираем HTML теги
            cleaned = cleaned.replace(/<[^>]*>/g, '');
            
            // Убираем лишние кавычки
            cleaned = cleaned.replace(/^["']|["']$/g, '');
            
            // Убираем escape-последовательности
            cleaned = cleaned.replace(/\\n/g, ' ');
            cleaned = cleaned.replace(/\\t/g, ' ');
            cleaned = cleaned.replace(/\\r/g, ' ');
            cleaned = cleaned.replace(/\\"/g, '"');
            cleaned = cleaned.replace(/\\\\/g, '\\');
            
            // Убираем лишние пробелы
            cleaned = cleaned.trim();
            cleaned = cleaned.replace(/\s+/g, ' ');
            
            // Если сообщение все еще выглядит как JSON, пытаемся распарсить
            if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
                try {
                    const parsed = JSON.parse(cleaned);
                    return this.extractMessageFromError(parsed);
                } catch (e) {
                    // Оставляем как есть
                }
            }
            
            return cleaned;
        }

        showNotification(message, type = 'info') {
            const notifications = document.getElementById('notifications');
            if (!notifications) {
                console.log('Notification container not found');
                return;
            }

            // Извлекаем чистое сообщение
            const cleanMessage = this.extractMessageFromError(message);

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            // Создаем прогресс-бар
            const progressBar = document.createElement('div');
            progressBar.className = 'notification-progress';
            
            // Создаем кнопку закрытия
            const closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '&times;';
            closeButton.setAttribute('aria-label', 'Закрыть уведомление');
            
            // Добавляем текст сообщения
            const messageElement = document.createElement('div');
            messageElement.textContent = cleanMessage;
            messageElement.style.paddingRight = '30px'; // Место для кнопки закрытия
            
            notification.appendChild(progressBar);
            notification.appendChild(closeButton);
            notification.appendChild(messageElement);

            notifications.appendChild(notification);

            // Функция для закрытия уведомления
            const closeNotification = () => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            };

            // Обработчики для закрытия
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                closeNotification();
            });

            notification.addEventListener('click', closeNotification);

            // Автоматическое закрытие через 5 секунд
            const autoCloseTimeout = setTimeout(closeNotification, 5000);

            // Останавливаем автоматическое закрытие при наведении
            notification.addEventListener('mouseenter', () => {
                progressBar.style.animationPlayState = 'paused';
                clearTimeout(autoCloseTimeout);
            });

            // Возобновляем автоматическое закрытие когда убрали курсор
            notification.addEventListener('mouseleave', () => {
                progressBar.style.animationPlayState = 'running';
                setTimeout(closeNotification, 5000 - (5000 * (1 - getComputedStyle(progressBar).transform.split(',')[0] * 1)));
            });
        }

        createButton(text, onClick, className = '') {
            const button = document.createElement('button');
            button.className = `btn ${className}`;
            button.textContent = text;
            button.addEventListener('click', onClick);
            return button;
        }

        createList(items, itemRenderer) {
            const list = document.createElement('div');
            list.className = 'list';

            items.forEach(item => {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.innerHTML = itemRenderer(item);
                list.appendChild(listItem);
            });

            return list;
        }

        showLoading(element) {
            element.innerHTML = '<div class="loading">Загрузка...</div>';
        }

        hideElement(element) {
            element.style.display = 'none';
        }

        showElement(element) {
            element.style.display = 'block';
        }
    }

    window.UI = UI;
}