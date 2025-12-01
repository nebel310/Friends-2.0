import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext'; // Добавляем импорт
import { apiService } from '../../services/api';

const WorkingAddFriendForm = ({ onFriendAdded }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth(); // Теперь user доступен

  // Функция для сохранения исходящей заявки в localStorage
  const saveOutgoingRequest = (username, friendshipId) => {
    try {
      console.log('Saving outgoing request for:', username, 'friendshipId:', friendshipId);
      
      const outgoingRequests = JSON.parse(localStorage.getItem('outgoingRequests') || '[]');
      
      // Проверяем нет ли уже заявки этому пользователю
      const existingRequest = outgoingRequests.find(req => 
        req.username === username
      );
      
      if (!existingRequest) {
        const newRequest = {
  id: friendshipId,
  username: username,
  sender: user?.username, // ДОБАВЛЯЕМ КТО ОТПРАВИЛ
  created_at: new Date().toISOString(),
  status: 'pending'
};
        
        const updatedRequests = [...outgoingRequests, newRequest];
        localStorage.setItem('outgoingRequests', JSON.stringify(updatedRequests));
        
        // Триггерим событие для обновления сайдбара
        window.dispatchEvent(new Event('storage'));
        console.log('✅ Saved outgoing request:', newRequest);
      } else {
        console.log('⚠️ Request already exists for:', username);
      }
    } catch (error) {
      console.error('❌ Error saving outgoing request:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      showToast('Введите username', 'error');
      return;
    }

    // ДЕБАГ: Проверяем данные пользователя
    console.log('🔍 DEBUG:');
    console.log(' - Current user:', user);
    console.log(' - Target username:', trimmedUsername);
    
    if (user) {
      console.log(' - User username:', user.username);
      console.log(' - User email:', user.email);
      console.log(' - Are they the same?', user.username === trimmedUsername || user.email === trimmedUsername);
    }

    // Проверяем что пользователь не отправляет заявку самому себе
    if (user && (user.username === trimmedUsername || user.email === trimmedUsername)) {
      console.log('❌ BLOCKED: Trying to send request to self');
      showToast('❌ Нельзя отправить заявку самому себе', 'error');
      return;
    }

    console.log('🚀 Sending friend request to:', trimmedUsername);

    setLoading(true);
    
    try {
      const response = await apiService.sendFriendRequest(trimmedUsername);
      console.log('📨 API Response:', response);
      
      if (response && response.friendship_id) {
        // Сохраняем исходящую заявку только при успешной отправке
        saveOutgoingRequest(trimmedUsername, response.friendship_id);
        
        showToast(`✅ Заявка отправлена пользователю ${trimmedUsername}`, 'success');
        setUsername('');
        
        if (onFriendAdded) {
          onFriendAdded();
        }
      } else {
        showToast('Не удалось отправить заявку', 'error');
      }
    } catch (error) {
      console.error('❌ Error sending request:', error);
      
      if (error.message.includes('не найден') || error.message.includes('404')) {
        showToast('❌ Пользователь не найден. Попробуйте другой username', 'error');
      } else if (error.message.includes('самому себе')) {
        showToast('❌ Нельзя отправить заявку самому себе', 'error');
      } else if (error.message.includes('уже отправлена') || error.message.includes('уже существует') || error.message.includes('409')) {
        showToast('⚠️ Заявка уже отправлена этому пользователю', 'warning');
      } else if (error.message.includes('уже в друзьях')) {
        showToast('✅ Этот пользователь уже у вас в друзьях', 'info');
      } else {
        showToast('❌ Ошибка отправки заявки', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card add-friend-form">
      <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Добавить друга</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Введите username пользователя"
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            minHeight: '48px'
          }}
        />
        <button 
          type="submit"
          disabled={loading || !username.trim()}
          style={{
            padding: '12px 24px',
            background: loading ? 'var(--text-muted)' : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            minHeight: '48px',
            minWidth: '140px',
            transition: 'var(--transition)'
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
              Отправка...
            </span>
          ) : (
            '📤 Отправить заявку'
          )}
        </button>
      </form>
    </div>
  );
};

export default WorkingAddFriendForm;