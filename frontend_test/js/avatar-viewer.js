// Класс для просмотра аватарок в полном размере
class AvatarViewer {
    constructor() {
        this.modal = null;
        this.image = null;
        this.init();
    }

    init() {
        // Создаем модальное окно для просмотра аватарок
        this.createModal();
        
        // Добавляем обработчики кликов на все аватарки
        this.setupAvatarClickHandlers();
    }

    createModal() {
        // Проверяем, нет ли уже такого модального окна
        if (document.getElementById('avatar-viewer-modal')) {
            this.modal = document.getElementById('avatar-viewer-modal');
            this.image = document.getElementById('avatar-viewer-image');
            return;
        }

        const modalHTML = `
            <div id="avatar-viewer-modal" class="modal-overlay" style="display: none;">
                <button class="avatar-viewer-close">&times;</button>
                <div class="avatar-viewer-container">
                    <img id="avatar-viewer-image" class="avatar-viewer-image" src="" alt="Аватар">
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.modal = document.getElementById('avatar-viewer-modal');
        this.image = document.getElementById('avatar-viewer-image');
        
        // Настраиваем обработчики закрытия
        this.setupCloseHandlers();
    }

    setupCloseHandlers() {
        const closeBtn = this.modal.querySelector('.avatar-viewer-close');
        
        const closeModal = () => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            this.image.src = '';
        };

        closeBtn.addEventListener('click', closeModal);
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                closeModal();
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                closeModal();
            }
        });
    }

    setupAvatarClickHandlers() {
        // Используем делегирование событий для динамически загруженных аватарок
        document.addEventListener('click', (e) => {
            // Проверяем, кликнули ли на аватарку
            const avatar = e.target.closest('.avatar-clickable, .avatar-image, .user-card-avatar, .user-detail-avatar, .avatar-preview img, .user-card-avatar-container img');
            
            if (avatar && avatar.src) {
                e.preventDefault();
                this.showAvatar(avatar.src);
            }
        });
    }

    showAvatar(imageSrc) {
        if (!this.modal || !this.image) {
            this.createModal();
        }
        
        this.image.src = imageSrc;
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Добавляем обработчик ошибки загрузки
        this.image.onerror = () => {
            this.image.alt = 'Не удалось загрузить изображение';
        };
    }

    // Метод для принудительного добавления обработчиков к новым элементам
    addAvatarClickListeners(container) {
        const avatars = container.querySelectorAll('.avatar-image, .user-card-avatar, .user-detail-avatar, .avatar-preview img, .user-card-avatar-container img');
        
        avatars.forEach(avatar => {
            if (!avatar.classList.contains('avatar-clickable')) {
                avatar.classList.add('avatar-clickable');
            }
        });
    }
}

// Создаем глобальный экземпляр
window.avatarViewer = new AvatarViewer();