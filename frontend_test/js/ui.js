// Проверяем, не объявлен ли уже класс UI
if (typeof UI === 'undefined') {
    class UI {
        constructor() {}

        showNotification(message, type = 'info') {
            const notifications = document.getElementById('notifications');
            if (!notifications) {
                console.log('Notification container not found');
                return;
            }

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                padding: 1rem;
                border-radius: 4px;
                color: white;
                margin-bottom: 0.5rem;
                max-width: 300px;
                background-color: ${this.getNotificationColor(type)};
            `;

            notifications.appendChild(notification);

            // Автоматическое скрытие через 5 секунд
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }

        getNotificationColor(type) {
            const colors = {
                success: '#27ae60',
                error: '#e74c3c',
                info: '#3498db'
            };
            return colors[type] || colors.info;
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