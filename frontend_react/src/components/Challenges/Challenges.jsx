import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import Sidebar from '../Layout/Sidebar';
import CreateChallengeModal from './CreateChallengeModal';
import ChallengeCard from './ChallengeCard';

const Challenges = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [challengesData, friendsData] = await Promise.all([
          apiService.getChallenges(),
          apiService.getFriends()
        ]);
        
        console.log('📥 Полученные челленджи:', challengesData);
        setChallenges(challengesData || []);
        setFriends(friendsData || []);
      } catch (error) {
        showToast('Ошибка загрузки данных', 'error');
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [showToast]);

  const handleCreateChallenge = async (challengeData) => {
    try {
      console.log('📤 Создание челленджа:', challengeData);
      await apiService.createChallenge(
        challengeData.friendship_id,
        challengeData.title,
        challengeData.description
      );
      
      showToast(`🎯 Челлендж "${challengeData.title}" создан!`, 'success');
      setShowCreateModal(false);
      // Перезагружаем данные
      const [challengesData, friendsData] = await Promise.all([
        apiService.getChallenges(),
        apiService.getFriends()
      ]);
      setChallenges(challengesData || []);
      setFriends(friendsData || []);
    } catch (error) {
      showToast('Ошибка создания челленджа', 'error');
      console.error('Failed to create challenge:', error);
    }
  };

  const handleAcceptChallenge = async (challengeId, title) => {
    try {
      await apiService.acceptChallenge(challengeId);
      showToast(`✅ Челлендж "${title}" принят!`, 'success');
      // Перезагружаем данные
      const [challengesData, friendsData] = await Promise.all([
        apiService.getChallenges(),
        apiService.getFriends()
      ]);
      setChallenges(challengesData || []);
      setFriends(friendsData || []);
    } catch (error) {
      showToast('Ошибка принятия челленджа', 'error');
      console.error('Failed to accept challenge:', error);
    }
  };

  const handleRejectChallenge = async (challengeId, title) => {
    try {
      await apiService.rejectChallenge(challengeId);
      showToast(`❌ Челлендж "${title}" отклонен`, 'info');
      // Перезагружаем данные
      const [challengesData, friendsData] = await Promise.all([
        apiService.getChallenges(),
        apiService.getFriends()
      ]);
      setChallenges(challengesData || []);
      setFriends(friendsData || []);
    } catch (error) {
      showToast('Ошибка отклонения челленджа', 'error');
      console.error('Failed to reject challenge:', error);
    }
  };

  // Фильтруем челленджи по статусу
  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const activeChallenges = challenges.filter(c => c.status === 'accepted');
  const completedChallenges = challenges.filter(c => c.status === 'completed');
  const approvedChallenges = challenges.filter(c => c.status === 'approved');

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">
            🏆 Челленджи
          </h1>
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div>{user?.username || 'Пользователь'}</div>
              <div className="user-status">online</div>
            </div>
          </div>
        </div>

        <div className="challenges-header-actions">
          <button 
            className="btn btn-primary create-challenge-btn"
            onClick={() => setShowCreateModal(true)}
          >
            🏆 Создать челлендж
          </button>
        </div>

        {/* Ожидающие принятия */}
        {pendingChallenges.length > 0 && (
          <div className="challenges-section">
            <h3 className="section-title">
              ⏳ Ожидают принятия
              <span className="section-count warning">
                {pendingChallenges.length}
              </span>
            </h3>
            <div className="requests-container">
              {pendingChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id}
                  challenge={challenge}
                  friends={friends}
                  onAccept={handleAcceptChallenge}
                  onReject={handleRejectChallenge}
                  type="pending"
                />
              ))}
            </div>
          </div>
        )}

        {/* Активные челленджи */}
        {activeChallenges.length > 0 && (
          <div className="challenges-section">
            <h3 className="section-title">
              🎯 Активные челленджи
              <span className="section-count success">
                {activeChallenges.length}
              </span>
            </h3>
            <div className="requests-container">
              {activeChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id}
                  challenge={challenge}
                  friends={friends}
                  onComplete={() => navigate(`/challenge/${challenge.id}`)}
                  type="active"
                />
              ))}
            </div>
          </div>
        )}

        {/* Ожидают подтверждения */}
        {completedChallenges.length > 0 && (
          <div className="challenges-section">
            <h3 className="section-title">
              ✅ Ожидают подтверждения
              <span className="section-count muted">
                {completedChallenges.length}
              </span>
            </h3>
            <div className="requests-container">
              {completedChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id}
                  challenge={challenge}
                  friends={friends}
                  type="completed"
                />
              ))}
            </div>
          </div>
        )}

        {/* Подтвержденные челленджи */}
        {approvedChallenges.length > 0 && (
          <div className="challenges-section">
            <h3 className="section-title">
              🏆 Подтвержденные челленджи
              <span className="section-count success">
                {approvedChallenges.length}
              </span>
            </h3>
            <div className="requests-container">
              {approvedChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id}
                  challenge={challenge}
                  friends={friends}
                  type="approved"
                />
              ))}
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {!loading && challenges.length === 0 && (
          <div className="empty-state-content">
            <div className="empty-icon-large">🏆</div>
            <h2 className="empty-title">Нет активных челленджей</h2>
            <p className="empty-description">
              Создайте свой первый челлендж и бросьте вызов другу!
            </p>
          </div>
        )}

        {loading && (
          <div className="loading-spinner">Загрузка челленджей...</div>
        )}

        {showCreateModal && (
          <CreateChallengeModal
            friends={friends}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateChallenge}
          />
        )}
      </div>
    </div>
  );
};

export default Challenges;