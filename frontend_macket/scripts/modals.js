// Modal functionality
class Modals {
    constructor() {
        this.currentChallengeId = null;
        this.selectedFiles = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-modal');
                this.hideModal(modalId);
            });
        });

        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideModal(overlay.id);
                }
            });
        });

        // File upload
        const fileDropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('file-input');

        fileDropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('dragover');
        });

        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('dragover');
        });

        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Form submissions
        document.getElementById('submit-proofs').addEventListener('click', () => {
            this.submitProofs();
        });

        document.getElementById('submit-rejection').addEventListener('click', () => {
            this.submitRejection();
        });

        document.getElementById('create-challenge').addEventListener('click', () => {
            this.createChallenge();
        });
    }

    showUploadModal(challengeId = null) {
        this.currentChallengeId = challengeId;
        this.selectedFiles = [];
        this.updateFilePreview();
        this.showModal('upload-modal');
    }

    showRejectModal(challengeId = null) {
        this.currentChallengeId = challengeId;
        document.getElementById('rejection-reason').value = '';
        this.showModal('reject-modal');
    }

    showCreateChallengeModal() {
        document.getElementById('challenge-title').value = '';
        document.getElementById('challenge-description').value = '';
        this.showModal('create-challenge-modal');
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetFileInput();
    }

    handleFiles(files) {
        for (let file of files) {
            if (this.isValidFile(file)) {
                this.selectedFiles.push(file);
            }
        }
        this.updateFilePreview();
    }

    isValidFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
        const maxSize = 100 * 1024 * 1024; // 100MB

        if (!validTypes.includes(file.type)) {
            alert('Неподдерживаемый формат файла. Используйте изображения (JPEG, PNG, GIF) или видео (MP4, AVI, MOV).');
            return false;
        }

        if (file.size > maxSize) {
            alert('Файл слишком большой. Максимальный размер: 100MB.');
            return false;
        }

        return true;
    }

    updateFilePreview() {
        const previewContainer = document.getElementById('file-preview');
        const fileDropZone = document.getElementById('file-drop-zone');

        if (this.selectedFiles.length === 0) {
            previewContainer.style.display = 'none';
            fileDropZone.style.display = 'block';
            return;
        }

        previewContainer.style.display = 'block';
        fileDropZone.style.display = 'none';

        previewContainer.innerHTML = this.selectedFiles.map((file, index) => {
            const url = URL.createObjectURL(file);
            const isImage = file.type.startsWith('image/');
            
            return `
                <div class="file-preview-item">
                    ${isImage ? 
                        `<img src="${url}" alt="Preview">` : 
                        `<video src="${url}" controls></video>`
                    }
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${file.name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">
                            ${this.formatFileSize(file.size)}
                        </div>
                    </div>
                    <button class="btn btn-danger" onclick="modals.removeFile(${index})">✕</button>
                </div>
            `;
        }).join('');
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFilePreview();
    }

    resetFileInput() {
        document.getElementById('file-input').value = '';
        this.selectedFiles = [];
        this.updateFilePreview();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    submitProofs() {
        if (this.selectedFiles.length === 0) {
            alert('Пожалуйста, добавьте хотя бы один файл в качестве подтверждения.');
            return;
        }

        // Mock API call
        console.log('Submitting proofs for challenge:', this.currentChallengeId);
        console.log('Files:', this.selectedFiles);

        // Show success message
        alert('Пруфы успешно отправлены на проверку!');
        this.hideModal('upload-modal');

        // In real app, this would update the challenge status and refresh the UI
    }

    submitRejection() {
        const reason = document.getElementById('rejection-reason').value.trim();
        
        if (!reason) {
            alert('Пожалуйста, укажите причину отклонения.');
            return;
        }

        // Mock API call
        console.log('Rejecting challenge:', this.currentChallengeId);
        console.log('Reason:', reason);

        // Show success message
        alert('Задание отклонено!');
        this.hideModal('reject-modal');

        // In real app, this would update the challenge status and refresh the UI
    }

    createChallenge() {
        const title = document.getElementById('challenge-title').value.trim();
        const description = document.getElementById('challenge-description').value.trim();
        
        if (!title) {
            alert('Пожалуйста, введите название задания.');
            return;
        }

        if (!description) {
            alert('Пожалуйста, введите описание задания.');
            return;
        }

        // Call dashboard method to create challenge
        dashboard.createChallenge(title, description);
        this.hideModal('create-challenge-modal');
    }

    approveChallenge() {
        if (confirm('Одобрить выполнение задания?')) {
            // Mock API call
            console.log('Approving challenge:', this.currentChallengeId);
            alert('Задание одобрено!');
            
            // In real app, this would update the challenge status and refresh the UI
        }
    }
}

// Initialize modals
const modals = new Modals();