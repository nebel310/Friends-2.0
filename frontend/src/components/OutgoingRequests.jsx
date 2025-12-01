import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Sidebar from './Layout/Sidebar';

const OutgoingRequests = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOutgoingRequests();
  }, [user]);

  const loadOutgoingRequests = () => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('outgoingRequests') || '[]');
      
      // ФИЛЬТРУЕМ: показываем только заявки от текущего пользователя
      const userRequests = allRequests.filter(request => 
        request.sender === user?.username
      );
      
      console.log('Loaded outgoing requests for user:', user?.username, userRequests);
      setOutgoingRequests(userRequests);
    } catch (error) {
      console.error('Failed to load outgoing requests:', error);
      setOutgoingRequests([]);
    }
  };

  const handleCancelRequest = async (requestId, username) => {
    if (!window.confirm(`Отменить заявку для ${username}?`)) return;

    setLoading(true);
    try {
      // Удаляем из всех заявок
      const allRequests = JSON.parse(localStorage.getItem('outgoingRequests') || '[]');
      const updatedAllRequests = allRequests.filter(req => req.id !== requestId);
      localStorage.setItem('outgoingRequests', JSON.stringify(updatedAllRequests));
      
      // Обновляем локальное состояние
      const updatedRequests = outgoingRequests.filter(req => req.id !== requestId);
      setOutgoingRequests(updatedRequests);
      
      // Триггерим обновление сайдбара
      window.dispatchEvent(new Event('storage'));
      
      showToast(`Заявка для ${username} отменена`, 'success');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      showToast('Ошибка отмены заявки', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">
            Исходящие заявки
            {outgoingRequests.length > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '16px',
                marginLeft: '10px',
                fontWeight: '600'
              }}>
                {outgoingRequests.length}
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
            <div className="loading-spinner">Загрузка...</div>
          ) : outgoingRequests.length === 0 ? (
            <div className="empty-state-content">
              <div className="empty-icon-large">📤</div>
              <h2 className="empty-title">Нет исходящих заявок</h2>
              <p className="empty-description">
                Заявки, которые вы отправили, будут отображаться здесь
              </p>
            </div>
          ) : (
            outgoingRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-user">
                    <div className="request-avatar">
                      {request.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="request-info">
                      <h3>{request.username || 'Пользователь'}</h3>
                      <p>Ожидает подтверждения заявки</p>
                    </div>
                  </div>
                  <div className="request-status">
                    <span className="pair-status status-pending">⏳ Ожидание</span>
                  </div>
                </div>
                <div className="request-date">
                  Отправлено: {formatDate(request.created_at)}
                </div>
                <div className="request-actions">
  <button 
    className="btn-cancel-request"
    onClick={() => handleCancelRequest(request.id, request.username)}
    disabled={loading}
  >
    {loading ? '...' : 'Отменить'}
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

export default OutgoingRequests;