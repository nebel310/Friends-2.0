// Mock Data
const mockData = {
    pairs: [
        {
            id: 1,
            friend: { id: 2, name: 'Алексей Иванов', avatar: 'А', email: 'alex@example.com' },
            stats: { completed: 12, pending: 2 },
            createdAt: '12.01.2024'
        },
        {
            id: 2,
            friend: { id: 3, name: 'Мария Сидорова', avatar: 'М', email: 'maria@example.com' },
            stats: { completed: 8, pending: 1 },
            createdAt: '10.01.2024'
        },
        {
            id: 3,
            friend: { id: 4, name: 'Дмитрий Петров', avatar: 'Д', email: 'dmitry@example.com' },
            stats: { completed: 5, pending: 0 },
            createdAt: '08.01.2024'
        }
    ],

    challenges: {
        1: [ // Challenges for pair 1
            {
                id: 101,
                title: 'Прочитать книгу за неделю',
                description: 'Необходимо прочитать книгу "1984" и подготовить краткий отзыв объемом 200-300 слов.',
                status: 'pending',
                type: 'my-challenges',
                createdBy: 2,
                createdAt: '15.01.2024',
                deadline: '22.01.2024'
            },
            {
                id: 102,
                title: 'Сделать 100 отжиманий',
                description: 'Сделать 100 отжиманий в течение дня, можно разделить на подходы.',
                status: 'completed',
                type: 'my-challenges',
                createdBy: 2,
                createdAt: '14.01.2024',
                completedAt: '16.01.2024'
            },
            {
                id: 103,
                title: 'Пробежать 5 км',
                description: 'Пробежать 5 км без остановки, предоставить трек из приложения.',
                status: 'completed',
                type: 'moderation',
                createdBy: 1,
                createdAt: '13.01.2024',
                completedAt: '17.01.2024'
            }
        ]
    },

    requests: {
        incoming: [
            {
                id: 201,
                user: { id: 5, name: 'Сергей Козлов', avatar: 'С', email: 'sergey@example.com' },
                createdAt: '18.01.2024'
            },
            {
                id: 202,
                user: { id: 6, name: 'Ольга Новикова', avatar: 'О', email: 'olga@example.com' },
                createdAt: '17.01.2024'
            }
        ],
        outgoing: [
            {
                id: 301,
                user: { id: 7, name: 'Ирина Смирнова', avatar: 'И', email: 'irina@example.com' },
                createdAt: '16.01.2024',
                status: 'pending'
            }
        ]
    }
};

// Dashboard functionality
class Dashboard {
    constructor() {
        this.currentPairId = null;
        this.init();
    }

    init() {
        this.renderPairs();
        this.renderSidebarPairs();
        this.renderRequests();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add friend form
        document.getElementById('send-request-btn').addEventListener('click', () => {
            this.sendFriendRequest();
        });

        // Friend search input
        document.getElementById('friend-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendFriendRequest();
            }
        });

        // Initialize challenge lists when friendship section is shown
        document.getElementById('friendship-section').addEventListener('DOMNodeInserted', () => {
            if (this.currentPairId) {
                this.renderChallenges(this.currentPairId);
            }
        });
    }

    renderPairs() {
        const container = document.getElementById('pairs-grid');
        container.innerHTML = mockData.pairs.map(pair => `
            <div class="card pair-card" data-pair-id="${pair.id}">
                <div class="card-header">
                    <div class="friend-avatar">${pair.friend.avatar}</div>
                    <div class="friend-info">
                        <div class="friend-name">${pair.friend.name}</div>
                        <div class="friend-stats">${pair.stats.completed} выполненных заданий</div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" style="flex: 1;">Перейти в пару</button>
                    <button class="btn btn-danger" onclick="dashboard.removePair(${pair.id})">✕</button>
                </div>
            </div>
        `).join('');
    }

    renderSidebarPairs() {
        const container = document.getElementById('friendships-list');
        container.innerHTML = mockData.pairs.map(pair => `
            <a href="#" class="nav-item" data-section="friendship" data-pair-id="${pair.id}">
                <div class="nav-icon">👤</div>
                <span>${pair.friend.name}</span>
            </a>
        `).join('');

        // Add event listeners to sidebar pairs
        container.querySelectorAll('.nav-item[data-pair-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pairId = item.getAttribute('data-pair-id');
                this.showFriendshipDetail(pairId);
            });
        });
    }

    renderRequests() {
        // Incoming requests
        const incomingContainer = document.getElementById('incoming-requests');
        incomingContainer.innerHTML = mockData.requests.incoming.map(request => `
            <div class="request-item">
                <div class="request-user">
                    <div class="user-avatar">${request.user.avatar}</div>
                    <div>
                        <div class="friend-name">${request.user.name}</div>
                        <div class="friend-stats">Запрос отправлен ${request.createdAt}</div>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-success" onclick="dashboard.acceptRequest(${request.id})">Принять</button>
                    <button class="btn btn-danger" onclick="dashboard.rejectRequest(${request.id})">Отклонить</button>
                </div>
            </div>
        `).join('');

        // Outgoing requests
        const outgoingContainer = document.getElementById('outgoing-requests');
        outgoingContainer.innerHTML = mockData.requests.outgoing.map(request => `
            <div class="request-item">
                <div class="request-user">
                    <div class="user-avatar">${request.user.avatar}</div>
                    <div>
                        <div class="friend-name">${request.user.name}</div>
                        <div class="friend-stats">Запрос отправлен ${request.createdAt}</div>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-danger" onclick="dashboard.cancelRequest(${request.id})">Отменить</button>
                </div>
            </div>
        `).join('');
    }

    renderChallenges(pairId) {
        const challenges = mockData.challenges[pairId] || [];
        
        // My challenges
        const myChallenges = challenges.filter(c => c.type === 'my-challenges');
        document.getElementById('my-challenges-list').innerHTML = this.renderChallengeList(myChallenges);
        
        // Moderation challenges
        const moderationChallenges = challenges.filter(c => c.type === 'moderation');
        document.getElementById('moderation-list').innerHTML = this.renderChallengeList(moderationChallenges);
        
        // Archive challenges (filter completed/approved)
        const archiveChallenges = challenges.filter(c => 
            c.status === 'completed' || c.status === 'approved'
        );
        document.getElementById('pair-archive-list').innerHTML = this.renderChallengeList(archiveChallenges);
    }

    renderChallengeList(challenges) {
        return challenges.map(challenge => `
            <div class="challenge-item" data-challenge-id="${challenge.id}">
                <div class="challenge-header">
                    <div class="challenge-title">${challenge.title}</div>
                    <div class="challenge-status status-${challenge.status}">${this.getStatusText(challenge.status)}</div>
                </div>
                <div class="challenge-description">${challenge.description}</div>
                <div class="card-actions">
                    <button class="btn btn-primary">Подробнее</button>
                    ${challenge.status === 'pending' ? '<button class="btn btn-secondary">Отклонить</button>' : ''}
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Ожидает выполнения',
            'completed': 'Выполнено',
            'approved': 'Одобрено',
            'rejected': 'Отклонено'
        };
        return statusMap[status] || status;
    }

    showFriendshipDetail(pairId) {
        this.currentPairId = pairId;
        const pair = mockData.pairs.find(p => p.id == pairId);
        if (pair) {
            document.getElementById('friend-name').textContent = pair.friend.name;
            document.getElementById('friend-avatar').textContent = pair.friend.avatar;
            document.querySelector('.friendship-date').textContent = `Пара создана ${pair.createdAt}`;
            
            navigation.showSection('friendship-section');
            this.renderChallenges(pairId);
        }
    }

    sendFriendRequest() {
        const input = document.getElementById('friend-search');
        const usernameOrEmail = input.value.trim();
        
        if (!usernameOrEmail) {
            alert('Введите username или email');
            return;
        }

        // Mock API call
        console.log('Sending friend request to:', usernameOrEmail);
        
        // Show success message
        alert(`Запрос на дружбу отправлен пользователю ${usernameOrEmail}`);
        input.value = '';
        
        // In real app, this would update the UI with the new outgoing request
    }

    removePair(pairId) {
        if (confirm('Вы уверены, что хотите удалить эту пару?')) {
            // Mock API call
            console.log('Removing pair:', pairId);
            
            // Remove from UI
            const pairElement = document.querySelector(`[data-pair-id="${pairId}"]`);
            if (pairElement) {
                pairElement.remove();
            }
            
            // Update sidebar
            this.renderSidebarPairs();
        }
    }

    acceptRequest(requestId) {
        // Mock API call
        console.log('Accepting request:', requestId);
        alert('Запрос на дружбу принят!');
        
        // Remove from UI
        const requestElement = document.querySelector(`[data-request-id="${requestId}"]`);
        if (requestElement) {
            requestElement.remove();
        }
    }

    rejectRequest(requestId) {
        if (confirm('Отклонить запрос на дружбу?')) {
            // Mock API call
            console.log('Rejecting request:', requestId);
            
            // Remove from UI
            const requestElement = document.querySelector(`[data-request-id="${requestId}"]`);
            if (requestElement) {
                requestElement.remove();
            }
        }
    }

    cancelRequest(requestId) {
        if (confirm('Отменить исходящий запрос?')) {
            // Mock API call
            console.log('Canceling request:', requestId);
            
            // Remove from UI
            const requestElement = document.querySelector(`[data-request-id="${requestId}"]`);
            if (requestElement) {
                requestElement.remove();
            }
        }
    }

    createChallenge(title, description) {
        if (!this.currentPairId) return;
        
        // Mock API call
        console.log('Creating challenge:', { title, description, pairId: this.currentPairId });
        
        // Add to UI
        const newChallenge = {
            id: Date.now(),
            title,
            description,
            status: 'pending',
            type: 'my-challenges',
            createdBy: 1, // Current user
            createdAt: new Date().toLocaleDateString('ru-RU')
        };
        
        // Add to mock data
        if (!mockData.challenges[this.currentPairId]) {
            mockData.challenges[this.currentPairId] = [];
        }
        mockData.challenges[this.currentPairId].push(newChallenge);
        
        // Update UI
        this.renderChallenges(this.currentPairId);
    }
}

// Initialize dashboard
const dashboard = new Dashboard();