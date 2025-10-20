// archive.js - Функционал архива заданий
const API_BASE = 'http://185.31.165.210:3001/api';

// Загрузка архива заданий
async function loadArchive() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tasks/archive`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const archiveData = await response.json();
            displayArchive(archiveData);
        } else {
            throw new Error('Ошибка загрузки архива');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showEmptyArchive();
    }
}

// Отображение архива
function displayArchive(archiveData) {
    const container = document.getElementById('archiveFeed');
    
    if (!archiveData || !archiveData.tasks || archiveData.tasks.length === 0) {
        showEmptyArchive();
        return;
    }

    container.innerHTML = archiveData.tasks.map(task => `
        <div class="archive-item">
            <div class="archive-header">
                <div class="archive-users">
                    <span class="user-badge">${task.user1?.username?.charAt(0).toUpperCase() || 'П'}</span>
                    <span>+</span>
                    <span class="user-badge">${task.user2?.username?.charAt(0).toUpperCase() || 'Д'}</span>
                    <span>${task.user1?.username || 'Пользователь'} и ${task.user2?.username || 'Друг'}</span>
                </div>
                <div class="archive-date">${new Date(task.completedAt).toLocaleDateString()}</div>
            </div>
            <div class="archive-task">${task.title || 'Выполненное задание'}</div>
            <div class="archive-description">${task.description || 'Задание успешно выполнено'}</div>
            ${task.points ? `<div class="archive-points">+${task.points} очков</div>` : ''}
        </div>
    `).join('');
}

// Показать пустой архив
function showEmptyArchive() {
    const container = document.getElementById('archiveFeed');
    container.innerHTML = `
        <div class="empty-state-content">
            <div class="empty-icon-large">📊</div>
            <h2 class="empty-title">Архив пуст</h2>
            <p class="empty-description">
                Здесь будут появляться выполненные задания от всех пользователей.<br>
                Когда вы или другие пользователи завершат задания - они появятся здесь.
            </p>
        </div>
    `;
}

// Показать архив
function showArchive() {
    hideAllPages();
    document.getElementById('archiveContent').classList.add('active');
    loadArchive();
}

// Скрыть все страницы
function hideAllPages() {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
}

// Инициализация архива
function initializeArchive() {
    // Функция будет вызываться при переходе на вкладку архива
}

// Экспортируем функции
window.archiveModule = {
    showArchive,
    loadArchive
};