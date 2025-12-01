import React, { useState } from 'react';

const CreateChallengeModal = ({ friends, onClose, onCreate }) => {
  const [selectedFriend, setSelectedFriend] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFriend || !title.trim()) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (title.trim().length < 3) {
      alert('Название челленджа должно содержать минимум 3 символа');
      return;
    }

    setLoading(true);
    try {
      const challengeData = {
        friendship_id: parseInt(selectedFriend),
        title: title.trim(),
        description: description.trim() || null
      };
      
      console.log('📤 Отправляемые данные челленджа:', challengeData);
      await onCreate(challengeData);
    } catch (error) {
      console.error('❌ Error creating challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedFriendData = friends.find(f => f.friendship_id === parseInt(selectedFriend));

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🏆 Создать челлендж</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="friend-select">Выберите друга *:</label>
            <select
              id="friend-select"
              value={selectedFriend}
              onChange={(e) => setSelectedFriend(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            >
              <option value="">-- Выберите друга --</option>
              {friends.map(friend => (
                <option key={friend.friendship_id} value={friend.friendship_id}>
                  {friend.username} {friend.full_name ? `(${friend.full_name})` : ''}
                </option>
              ))}
            </select>
            {selectedFriendData && (
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--success)', 
                marginTop: '5px' 
              }}>
                ✅ Выбран: {selectedFriendData.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="challenge-title">Название челленджа *:</label>
            <input
              id="challenge-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Изучить React за неделю, Пробежать 5 км, Прочитать книгу..."
              className="form-input"
              required
              disabled={loading}
              maxLength={100}
            />
            <div style={{ 
              fontSize: '12px', 
              color: title.length > 0 ? 'var(--success)' : 'var(--text-muted)', 
              marginTop: '5px' 
            }}>
              Символов: {title.length}/100
              {title.length >= 3 && (
                <span style={{ marginLeft: '10px' }}>✅ Название добавлено</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="challenge-description">Описание (необязательно):</label>
            <textarea
              id="challenge-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите детали челленджа, условия выполнения, сроки, дополнительные требования..."
              className="form-input"
              rows="4"
              disabled={loading}
              maxLength={500}
            />
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              marginTop: '5px' 
            }}>
              Символов: {description.length}/500
              {description.length > 0 && (
                <span style={{ marginLeft: '10px', color: 'var(--success)' }}>
                  ✅ Описание добавлено
                </span>
              )}
            </div>
          </div>

          <div className="modal-info" style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', fontSize: '14px' }}>
              💡 Как работает челлендж?
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              <li>Друг получит уведомление о вашем вызове</li>
              <li>Он может принять или отклонить челлендж</li>
              <li>После выполнения нужно будет загрузить доказательства</li>
              <li>Вы подтвердите выполнение после проверки доказательств</li>
            </ul>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-error"
              onClick={onClose}
              disabled={loading}
            >
              Отменить
            </button>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={loading || !selectedFriend || title.trim().length < 3}
            >
              {loading ? '⏳ Создание...' : '🎯 Создать челлендж'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeModal;