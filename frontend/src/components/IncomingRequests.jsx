import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';
import Sidebar from './Layout/Sidebar';

const IncomingRequests = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await apiService.getFriendRequests();
      setRequests(data || []);
    } catch (error) {
      showToast('Ошибка загрузки заявок', 'error');
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (friendshipId, username) => {
    try {
      await apiService.acceptFriendRequest(friendshipId);
      showToast(`🎉 Теперь вы друзья с ${username}!`, 'success');
      loadRequests();
    } catch (error) {
      showToast('Ошибка принятия заявки', 'error');
    }
  };

  const handleReject = async (friendshipId, username) => {
    try {
      await apiService.rejectFriendRequest(friendshipId);
      showToast(`Заявка от ${username} отклонена`, 'info');
      loadRequests();
    } catch (error) {
      showToast('Ошибка отклонения заявки', 'error');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">
            Входящие заявки
            {requests.length > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '16px',
                marginLeft: '10px',
                fontWeight: '600'
              }}>
                {requests.length}
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

        <div className="requests-container">
          {loading ? (
            <div className="loading-spinner">Загрузка заявок...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state-content">
              <div className="empty-icon-large">📥</div>
              <h2 className="empty-title">Нет входящих заявок</h2>
              <p className="empty-description">
                Когда кто-то отправит вам заявку в друзья, она появится здесь
              </p>
            </div>
          ) : (
            requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-user">
                    <div className="request-avatar">
                      {request.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="request-info">
                      <h3>{request.username || 'Пользователь'}</h3>
                      <p>хочет добавить вас в друзья</p>
                    </div>
                  </div>
                  <div className="request-date">
                    {new Date().toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="request-actions">
  <button 
    className="btn-accept-request"
    onClick={() => handleAccept(request.id, request.username)}
  >
    Принять
  </button>
  <button 
    className="btn-reject-request"
    onClick={() => handleReject(request.id, request.username)}
  >
    Отклонить
  </button>
</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomingRequests;