import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChallengeCard = ({ challenge, onAccept, onReject, onComplete, type, friends = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isCreator = challenge.created_by?.username === user?.username;

  // Находим друга по friendship_id
  const findFriendByFriendshipId = (friendshipId) => {
    return friends.find(friend => friend.friendship_id === friendshipId);
  };

  const targetFriend = findFriendByFriendshipId(challenge.friendship_id);

  // ТОЧНОЕ ОПРЕДЕЛЕНИЕ УЧАСТНИКОВ
  const getParticipants = () => {
    const creator = challenge.created_by?.username || 'Неизвестный';
    
    // Если мы создатель, то получатель - targetFriend
    if (isCreator) {
      const receiver = targetFriend?.username || 'Неизвестный';
      return { creator, receiver };
    } 
    // Если мы не создатель, то получатель - это мы
    else {
      const receiver = user?.username || 'Вы';
      return { creator, receiver };
    }
  };

  const { creator, receiver } = getParticipants();

  // Ищем описание в разных полях
  const challengeDescription = 
    challenge.description || 
    challenge.details || 
    challenge.task_description || 
    '';

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { text: '⏳ Ожидание', color: 'status-pending' };
      case 'accepted': return { text: '🎯 Активен', color: 'status-active' };
      case 'completed': return { text: '✅ Ожидает подтверждения', color: 'status-pending' };
      case 'approved': return { text: '🏆 Подтвержден', color: 'status-active' };
      case 'rejected': return { text: '❌ Отклонен', color: 'status-pending' };
      default: return { text: status, color: 'status-pending' };
    }
  };

  const statusInfo = getStatusInfo(challenge.status);

  return (
    <div className="request-card challenge-card">
      <div className="request-header">
        <div className="request-user">
          <div className="request-avatar">
            {challenge.created_by?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="request-info">
            <h3 className="challenge-title">
              {challenge.title}
            </h3>
            {/* Показываем превью описания если оно есть */}
            {challengeDescription && (
              <p className="challenge-preview">
                {challengeDescription.length > 100 
                  ? `${challengeDescription.substring(0, 100)}...` 
                  : challengeDescription
                }
              </p>
            )}
            <p className="challenge-users">
              <span>От: <strong>{creator}</strong></span>
              <span style={{ margin: '0 5px' }}>→</span>
              <span>Кому: <strong>{receiver}</strong></span>
            </p>
          </div>
        </div>
        <div className="request-status">
          <span className={`pair-status ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>
      
      <div className="details-toggle">
        <button 
          className="btn-details"
          onClick={() => navigate(`/challenge/${challenge.id}`)}
        >
          📄 Полные детали
        </button>
        
        {type === 'completed' && isCreator && (
  <button 
    className="btn-review"
    onClick={() => navigate(`/challenge/${challenge.id}`)}
  >
    Проверить
  </button>
)}
      </div>
      
      <div className="request-actions">
        {type === 'pending' && (
          <>
            {isCreator ? (
              <button 
                className="btn-cancel-challenge"
                onClick={() => onReject(challenge.id, challenge.title)}
              >
                Отменить
              </button>
            ) : (
              <div className="challenge-actions">
                <button 
                  className="btn-accept-challenge"
                  onClick={() => onAccept(challenge.id, challenge.title)}
                >
                  Принять
                </button>
                <button 
                  className="btn-reject-challenge"
                  onClick={() => onReject(challenge.id, challenge.title)}
                >
                  Отклонить
                </button>
              </div>
            )}
          </>
        )}
        {type === 'active' && (
          <button 
            className="btn btn-complete"
            onClick={() => navigate(`/challenge/${challenge.id}`)}
          >
            🏆 Завершить челлендж
          </button>
        )}
        {type === 'completed' && (
  <span className="challenge-completed-text">
    {isCreator ? 'Ожидает вашего подтверждения' : 'Ожидает подтверждения'}
  </span>
)}
        {type === 'approved' && (
          <span className="challenge-completed">
            ✅ Подтвержден
          </span>
        )}
      </div>
    </div>
  );
};

export default ChallengeCard;