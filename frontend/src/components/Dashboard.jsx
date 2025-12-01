import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';
import Sidebar from './Layout/Sidebar';
import ActivePairs from './Dashboard/ActivePairs';
import WorkingAddFriendForm from './Dashboard/WorkingAddFriendForm';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activePairs, setActivePairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivePairs();
  }, []);

  const loadActivePairs = async () => {
    try {
      const friends = await apiService.getFriends();
      setActivePairs(friends || []);
    } catch (error) {
      showToast('Ошибка загрузки пар', 'error');
      console.error('Failed to load pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePair = async (friendshipId, username) => {
    if (window.confirm(`Вы уверены, что хотите удалить ${username} из друзей?`)) {
      try {
        await apiService.rejectFriendRequest(friendshipId);
        showToast(`${username} удален из друзей`, 'success');
        loadActivePairs();
      } catch (error) {
        showToast('Ошибка удаления пары', 'error');
      }
    }
  };

  const handleChallengeFriend = (friendshipId, username) => {
    // Редирект на страницу челленджей
    showToast(`Бросить вызов ${username} - переходим к челленджам!`, 'info');
    window.location.href = '/challenges'; // Редирект на страницу челленджей
  };

  const handleFriendAdded = () => {
    console.log('Friend request sent - refreshing data...');
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">
            Мои пары
            {activePairs.length > 0 && (
              <span style={{
                background: 'var(--success)',
                color: 'white',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '16px',
                marginLeft: '10px',
                fontWeight: '600'
              }}>
                {activePairs.length}
              </span>
            )}
          </h1>
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div>{user?.username || 'Пользователь'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>online</div>
            </div>
          </div>
        </div>

        <ActivePairs 
          pairs={activePairs} 
          loading={loading}
          onRemovePair={handleRemovePair}
          onChallengeFriend={handleChallengeFriend} // ✅ Теперь передаем функцию
        />

        <WorkingAddFriendForm onFriendAdded={handleFriendAdded} />
      </div>
    </div>
  );
};

export default Dashboard;