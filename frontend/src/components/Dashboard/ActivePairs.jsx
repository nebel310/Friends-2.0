import React from 'react';

const ActivePairs = ({ pairs, loading, onRemovePair, onChallengeFriend }) => {
  if (loading) {
    return (
      <div className="pairs-container">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  if (!pairs || pairs.length === 0) {
    return (
      <div className="empty-dashboard">
        <div className="empty-icon-large">👥</div>
        <h2 className="empty-title">У вас пока нет друзей</h2>
        <p className="empty-description">
          Начните добавлять друзей, чтобы создавать пары и выполнять задания вместе
        </p>
      </div>
    );
  }

  return (
    <div className="pairs-container">
      <div style={{ 
        marginBottom: '20px', 
        color: 'var(--text-secondary)',
        fontSize: '14px'
      }}>
        Всего друзей: <strong>{pairs.length}</strong>
      </div>
      
      {pairs.map(pair => (
        <div key={pair.id} className="pair-card">
          <div className="pair-header">
            <div className="pair-user">
              <div className="pair-avatar">
                {pair.username?.charAt(0).toUpperCase() || 'Д'}
              </div>
              <div className="pair-info">
                <h3>{pair.username || 'Друг'}</h3>
                <p>Ваш друг в приложении</p>
              </div>
            </div>
            <div className="pair-status status-active">✅ Активна</div>
          </div>
          <div className="pair-actions">
            <button 
              className="btn btn-primary btn-small"
              onClick={() => onChallengeFriend(pair.friendship_id, pair.username)}
            >
              🏆 Бросить вызов
            </button>
            <button 
              className="btn btn-error btn-small"
              onClick={() => onRemovePair(pair.friendship_id, pair.username)}
            >
              🗑️ Удалить из друзей
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivePairs;