// Проверяем, не объявлен ли уже класс UI
if (typeof UI === 'undefined') {
    class UI {
        constructor() {}

        extractMessageFromError(error) {
            // Извлекаем чистое текстовое сообщение из ошибки
            if (typeof error === 'string') {
                // Пробуем распарсить JSON строку
                try {
                    const parsed = JSON.parse(error);
                    if (parsed.detail) {
                        return parsed.detail;
                    }
                    if (parsed.message) {
                        return parsed.message;
                    }
                } catch (e) {
                    // Если не JSON, возвращаем как есть
                    return error;
                }
            }
            
            // Если это объект Error
            if (error instanceof Error) {
                return error.message;
            }
            
            // Если это объект с полем detail или message
            if (error && typeof error === 'object') {
                if (error.detail) {
                    return error.detail;
                }
                if (error.message) {
                    return error.message;
                }
            }
            
            // По умолчанию преобразуем в строку
            return String(error);
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