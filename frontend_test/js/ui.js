class UI {
    constructor() {
        // UI не зависит от Auth, получаем auth через параметры методов
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notifications.appendChild(notification);

        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Вспомогательные методы для создания UI элементов
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
}

export default UI;