// Проверяем, не объявлен ли уже класс Modal
if (typeof Modal === 'undefined') {
    class Modal {
        static confirm(message, title = 'Подтверждение') {
            return new Promise((resolve) => {
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                
                const modal = document.createElement('div');
                modal.className = 'modal-content';
                modal.innerHTML = `
                    <button class="modal-close">&times;</button>
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-danger" id="modal-cancel">Отмена</button>
                        <button class="btn btn-success" id="modal-confirm">Подтвердить</button>
                    </div>
                `;

                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                document.body.style.overflow = 'hidden';

                const closeModal = (result) => {
                    overlay.style.animation = 'fadeOut 0.3s ease forwards';
                    modal.style.animation = 'slideDown 0.3s ease forwards';
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                        document.body.style.overflow = '';
                    }, 300);
                    resolve(result);
                };

                // Добавляем стили для анимации закрытия
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    @keyframes slideDown {
                        from {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                        to {
                            opacity: 0;
                            transform: translateY(20px) scale(0.95);
                        }
                    }
                `;
                document.head.appendChild(style);

                modal.querySelector('#modal-confirm').addEventListener('click', () => closeModal(true));
                modal.querySelector('#modal-cancel').addEventListener('click', () => closeModal(false));
                modal.querySelector('.modal-close').addEventListener('click', () => closeModal(false));
                
                // Закрытие по клику на overlay
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        closeModal(false);
                    }
                });

                // Закрытие по ESC
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        closeModal(false);
                        document.removeEventListener('keydown', handleEscape);
                    }
                };
                document.addEventListener('keydown', handleEscape);
            });
        }

        static alert(message, title = 'Уведомление') {
            return new Promise((resolve) => {
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                
                const modal = document.createElement('div');
                modal.className = 'modal-content';
                modal.innerHTML = `
                    <button class="modal-close">&times;</button>
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="modal-ok">OK</button>
                    </div>
                `;

                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                document.body.style.overflow = 'hidden';

                const closeModal = () => {
                    overlay.style.animation = 'fadeOut 0.3s ease forwards';
                    modal.style.animation = 'slideDown 0.3s ease forwards';
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                        document.body.style.overflow = '';
                    }, 300);
                    resolve();
                };

                const style = document.createElement('style');
                style.textContent = `
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    @keyframes slideDown {
                        from {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                        to {
                            opacity: 0;
                            transform: translateY(20px) scale(0.95);
                        }
                    }
                `;
                document.head.appendChild(style);

                modal.querySelector('#modal-ok').addEventListener('click', closeModal);
                modal.querySelector('.modal-close').addEventListener('click', closeModal);
                
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        closeModal();
                    }
                });

                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        closeModal();
                        document.removeEventListener('keydown', handleEscape);
                    }
                };
                document.addEventListener('keydown', handleEscape);
            });
        }
    }

    window.Modal = Modal;
}