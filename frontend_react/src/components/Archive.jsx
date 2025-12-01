import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';
import Sidebar from './Layout/Sidebar';

const Archive = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchive();
    loadFriends();
  }, []);

  const loadArchive = async () => {
    try {
      const data = await apiService.getChallenges();
      // Фильтруем только ПОДТВЕРЖДЕННЫЕ челленджи
      const approvedChallenges = (data || []).filter(challenge => 
        challenge.status === 'approved'
      );
      setChallenges(approvedChallenges);
    } catch (error) {
      showToast('Ошибка загрузки архива', 'error');
      console.error('Failed to load archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const friendsData = await apiService.getFriends();
      setFriends(friendsData || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  // Находим получателя по friendship_id
  const findFriendByFriendshipId = (friendshipId) => {
    return friends.find(friend => friend.friendship_id === friendshipId);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">🏆 Архив подтвержденных челленджей</h1>
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

        {/* Статистика */}
        {!loading && challenges.length > 0 && (
          <div style={{
            background: 'var(--bg-hover)',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              flexWrap: 'wrap'
            }}>
              <span>📊 Всего подтвержденных челленджей: <strong>{challenges.length}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>🎯 Успешно завершены и проверены</span>
            </div>
          </div>
        )}

        <div id="archiveFeed" className="archive-feed">
          {loading ? (
            <div className="loading-spinner">Загрузка архива...</div>
          ) : challenges.length === 0 ? (
            <div className="empty-state-content">
              <div className="empty-icon-large">🏆</div>
              <h2 className="empty-title">Архив пуст</h2>
              <p className="empty-description">
                Здесь будут появляться только подтвержденные челленджи.<br />
                
              </p>
            </div>
          ) : (
            challenges.map(challenge => {
              const targetFriend = findFriendByFriendshipId(challenge.friendship_id);
              const targetUsername = targetFriend?.username || 'Неизвестный пользователь';
              const creatorUsername = challenge.created_by?.username || 'Пользователь';
              
              return (
                <div key={challenge.id} className="archive-item">
                  <div className="archive-header">
                    <div className="archive-users">
                      <span className="user-badge">
                        {creatorUsername.charAt(0).toUpperCase()}
                      </span>
                      <span>→</span>
                      <span className="user-badge">
                        {targetUsername.charAt(0).toUpperCase()}
                      </span>
                      <span style={{ marginLeft: '8px' }}>
                        {creatorUsername} → {targetUsername}
                      </span>
                    </div>
                    <div className="archive-date">
                      {new Date(challenge.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <div className="archive-task">{challenge.title}</div>
                  <div className="archive-description">
                    {challenge.description || 'Челлендж успешно выполнен и подтвержден'}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border)',
                    color: 'var(--success)',
                    fontSize: '14px'
                  }}>
                    <span>✅ Подтверждено</span>
                    <span>•</span>
                    <span>
                      {new Date(challenge.updated_at || challenge.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Archive;