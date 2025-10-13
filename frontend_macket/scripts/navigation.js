// Navigation State Management
class Navigation {
    constructor() {
        this.currentSection = 'pairs-section';
        this.previousSection = '';
        this.history = ['pairs-section'];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSection('pairs-section');
        this.updateActiveNav();
    }

    setupEventListeners() {
        // Desktop sidebar navigation
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(`${section}-section`);
            });
        });

        // Mobile bottom navigation
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(`${section}-section`);
                this.updateMobileNav(section);
            });
        });

        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            this.goBack();
        });

        // Pair cards navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pair-card .btn-primary') || 
                e.target.closest('.challenge-item .btn-primary')) {
                const card = e.target.closest('.pair-card, .challenge-item');
                if (card) {
                    if (card.classList.contains('pair-card')) {
                        this.showFriendshipDetail(card);
                    } else {
                        this.showChallengeDetail(card);
                    }
                }
            }
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.getAttribute('data-tab'));
            });
        });
    }

    showSection(sectionId) {
        if (sectionId === this.currentSection) return;

        this.previousSection = this.currentSection;
        this.currentSection = sectionId;
        this.history.push(sectionId);

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.classList.add('fade-in');
        }

        this.updateBackButton();
        this.updateActiveNav();
        this.scrollToTop();
    }

    showFriendshipDetail(card) {
        const friendName = card.querySelector('.friend-name').textContent;
        const friendAvatar = card.querySelector('.friend-avatar').textContent;
        
        document.getElementById('friend-name').textContent = friendName;
        document.getElementById('friend-avatar').textContent = friendAvatar;
        
        this.showSection('friendship-section');
        this.switchTab('my-challenges');
    }

    showChallengeDetail(card) {
        const challengeTitle = card.querySelector('.challenge-title').textContent;
        const challengeStatus = card.querySelector('.challenge-status').textContent;
        const challengeDescription = card.querySelector('.challenge-description').textContent;
        
        // In a real app, this would fetch challenge details from API
        this.renderChallengeDetail({
            title: challengeTitle,
            status: challengeStatus,
            description: challengeDescription,
            createdBy: 'Алексей Иванов',
            createdAt: '15.01.2024',
            deadline: '20.01.2024'
        });
        
        this.showSection('challenge-section');
    }

    renderChallengeDetail(challenge) {
        const container = document.getElementById('challenge-detail-content');
        container.innerHTML = `
            <div class="challenge-item">
                <div class="challenge-header">
                    <div class="challenge-title">${challenge.title}</div>
                    <div class="challenge-status status-${challenge.status.toLowerCase()}">${challenge.status}</div>
                </div>
                <div class="challenge-description">
                    <p><strong>Описание:</strong> ${challenge.description}</p>
                </div>
                
                <div class="challenge-meta">
                    <div class="meta-item">
                        <span class="meta-label">Создатель</span>
                        <span class="meta-value">${challenge.createdBy}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Дата создания</span>
                        <span class="meta-value">${challenge.createdAt}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Срок выполнения</span>
                        <span class="meta-value">${challenge.deadline}</span>
                    </div>
                </div>
                
                <div class="challenge-actions">
                    ${this.getChallengeActions(challenge.status)}
                </div>
            </div>
        `;
    }

    getChallengeActions(status) {
        const basePath = location.pathname.includes('/dashboard.html') ? '' : './';
        
        switch(status.toLowerCase()) {
            case 'ожидает выполнения':
                return `
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="modals.showUploadModal()">Выполнить задание</button>
                        <button class="btn btn-secondary" onclick="modals.showRejectModal()">Отклонить вызов</button>
                    </div>
                `;
            case 'ожидает проверки':
                return `
                    <div class="proofs-gallery">
                        <div class="proof-item">
                            <img src="${basePath}assets/placeholder.jpg" alt="Proof">
                            <div class="proof-actions">
                                <button class="btn btn-success" onclick="modals.approveChallenge()">✓</button>
                                <button class="btn btn-danger" onclick="modals.showRejectModal()">✕</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-success" onclick="modals.approveChallenge()">Одобрить</button>
                        <button class="btn btn-danger" onclick="modals.showRejectModal()">Отклонить</button>
                    </div>
                `;
            case 'выполнено':
                return `
                    <div class="proofs-gallery">
                        <div class="proof-item">
                            <img src="${basePath}assets/placeholder.jpg" alt="Proof">
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary">В архив</button>
                    </div>
                `;
            default:
                return '<p>Задание завершено</p>';
        }
    }

    switchTab(tabId) {
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
        
        // Show tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-content`).classList.add('active');
    }

    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // Remove current
            const previous = this.history.pop(); // Get previous
            if (previous) {
                this.showSection(previous);
            }
        } else {
            this.showSection('pairs-section');
        }
    }

    updateBackButton() {
        const backButton = document.getElementById('backButton');
        const showBack = !['pairs-section', 'archive-section'].includes(this.currentSection);
        backButton.style.display = showBack ? 'block' : 'none';
    }

    updateActiveNav() {
        const currentNav = this.currentSection.replace('-section', '');
        
        // Update desktop nav
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === currentNav) {
                item.classList.add('active');
            }
        });

        // Update mobile nav
        this.updateMobileNav(currentNav);
    }

    updateMobileNav(currentNav) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === currentNav) {
                item.classList.add('active');
            }
        });
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialize navigation
const navigation = new Navigation();