import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';

const AddFriendForm = ({ onFriendAdded }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      showToast('Введите username или email', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiService.sendFriendRequest(username.trim());
      
      if (response && response.friendship_id) {
        showToast(`Заявка отправлена пользователю ${username}`, 'success');
        setUsername('');
        if (onFriendAdded) {
          onFriendAdded();
        }
      } else {
        showToast('Не удалось отправить заявку', 'error');
      }
    } catch (error) {
      // Обрабатываем разные типы ошибок
      if (error.message.includes('404') || error.message.includes('not found')) {
        showToast('Пользователь не найден', 'error');
      } else if (error.message.includes('400') || error.message.includes('already')) {
        showToast('Заявка уже отправлена или пользователь уже в друзьях', 'warning');
      } else {
        showToast(error.message || 'Ошибка отправки заявки', 'error');
      }
      console.error('Failed to send friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card add-friend-form">
      <h3 style={{ marginBottom: '15px' }}>Добавить друга</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          className="form-input add-friend-input"
          placeholder="Введите username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Отправка...' : 'Отправить заявку'}
        </button>
      </form>
    </div>
  );
};

export default AddFriendForm;