import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import Sidebar from '../Layout/Sidebar';
import CompleteChallengeModal from './CompleteChallengeModal';

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    loadChallengeDetail();
  }, [id]);

  const loadChallengeDetail = async () => {
    try {
      setLoading(true);
      const data = await apiService.getChallengeDetail(id);
      console.log('📦 Полные данные челленджа:', data);
      console.log('📸 Proofs в данных:', data.proofs);
      
      setChallenge(data);
      setProofs(data.proofs || []);
      
      // Загружаем ревью
      await loadReviews();
    } catch (error) {
      console.error('❌ Ошибка загрузки челленджа:', error);
      showToast('Ошибка загрузки деталей челленджа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const reviewsData = await apiService.getChallengeReviews(id);
      setReviews(reviewsData?.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    }
  };

  const getProofFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    
    // Преобразуем относительные URL
    if (fileUrl.startsWith('/')) {
      return `http://localhost:3001${fileUrl}`;
    }
    
    // Извлекаем имя файла из пути
    const fileName = fileUrl.includes('/') ? fileUrl.split('/').pop() : fileUrl;
    return `http://localhost:3001/files/download/${fileName}`;
  };

  const handleAccept = async () => {
    try {
      await apiService.acceptChallenge(id);
      showToast('✅ Челлендж принят!', 'success');
      await loadChallengeDetail();
    } catch (error) {
      showToast('Ошибка принятия челленджа', 'error');
    }
  };

  const handleReject = async () => {
    if (window.confirm('Вы уверены, что хотите отклонить этот челлендж?')) {
      try {
        await apiService.rejectChallenge(id);
        showToast('❌ Челлендж отклонен', 'info');
        navigate('/challenges');
      } catch (error) {
        showToast('Ошибка отклонения челленджа', 'error');
      }
    }
  };

  const handleCompleteClick = () => {
    setShowCompleteModal(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот челлендж?')) {
      try {
        await apiService.deleteChallenge(id);
        showToast('🗑️ Челлендж удален', 'info');
        navigate('/challenges');
      } catch (error) {
        showToast('Ошибка удаления челленджа', 'error');
      }
    }
  };

  const handleCompleteSubmit = async (type, data) => {
    try {
      if (type === 'success') {
        // Если переданы файлы, используем комплексный метод
        if (data.files && data.files.length > 0) {
          await apiService.completeChallengeWithProofs(id, data.files, data.description);
        } else {
          await apiService.completeChallenge(id);
        }
        showToast('✅ Челлендж отправлен на проверку!', 'success');
      }
      
      setShowCompleteModal(false);
      await loadChallengeDetail();
    } catch (error) {
      console.error('❌ Ошибка завершения челленджа:', error);
      showToast('Ошибка при завершении челленджа', 'error');
    }
  };

  const handleApproveProofs = async (comment = '') => {
    try {
      await apiService.createChallengeReview(id, true, comment);
      showToast('✅ Челлендж подтвержден!', 'success');
      await loadChallengeDetail();
    } catch (error) {
      showToast('Ошибка подтверждения', 'error');
    }
  };

  const handleRejectProofs = async (comment = '') => {
    if (!comment.trim()) {
      alert('Пожалуйста, укажите причину отклонения');
      return;
    }
    
    try {
      await apiService.createChallengeReview(id, false, comment);
      showToast('❌ Челлендж отклонен', 'info');
      await loadChallengeDetail();
    } catch (error) {
      showToast('Ошибка отклонения', 'error');
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': 
        return { text: '⏳ Ожидание принятия', color: 'status-pending' };
      case 'accepted': 
        return { text: '🎯 Активен', color: 'status-active' };
      case 'completed': 
        return { text: '✅ Ожидает подтверждения', color: 'status-pending' };
      case 'approved': 
        return { text: '🏆 Подтвержден', color: 'status-active' };
      case 'rejected': 
        return { text: '❌ Отклонен', color: 'status-pending' };
      default: 
        return { text: status, color: 'status-pending' };
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <div className="loading-spinner">Загрузка деталей челленджа...</div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <div className="empty-state-content">
            <div className="empty-icon-large">❌</div>
            <h2 className="empty-title">Челлендж не найден</h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/challenges')}
            >
              ← Назад к челленджам
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(challenge.status);
  const isCreator = challenge.created_by?.id === user?.id;
  const isReceiver = !isCreator;
  
  const challengeDescription = challenge.description || 'Описание не добавлено';

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ width: '200px' }}></div>
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
        </div>

        {/* Основной контент */}
        <div className="challenge-detail-content">
          {/* Кнопка назад и заголовок */}
          <div className="page-header">
            <button 
              className="btn btn-outline btn-back"
              onClick={() => navigate('/challenges')}
            >
              ← Назад
            </button>
            <div className="page-title-section">
              <h1 className="page-title-main">Челлендж</h1>
              <div className="page-subtitle">{challenge.title}</div>
            </div>
          </div>

          {/* Карточка челленджа */}
          <div className="card">
            {/* Заголовок и статус */}
            <div className="request-header" style={{ marginBottom: '20px' }}>
              <div className="request-user">
                <div className="request-avatar">
                  {challenge.created_by?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="request-info">
                  <h1 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>
                    {challenge.title}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`pair-status ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      Создатель: <strong>{challenge.created_by?.username || 'Неизвестно'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Описание челленджа */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>📝 Описание</h3>
              <div style={{
                background: 'var(--bg-hover)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {challengeDescription}
                </p>
              </div>
            </div>

            {/* Информационные карточки */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{
                background: 'var(--bg-hover)',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>📅 Создан</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {new Date(challenge.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-hover)',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>🎯 Статус</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {statusInfo.text}
                </div>
              </div>

              {challenge.completed_at && (
                <div style={{
                  background: 'var(--bg-hover)',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>✅ Завершен</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {new Date(challenge.completed_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 📸 Блок доказательств выполнения - УПРОЩЕННЫЙ ВАРИАНТ */}
            {proofs.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
                    📸 Доказательства выполнения ({proofs.length})
                  </h3>

                </div>
                
                <div style={{
                  background: 'var(--bg-hover)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                    {proofs.slice(0, 3).map((proof, index) => {
                      const fileUrl = getProofFileUrl(proof.file_url);
                      
                      return (
                        <div key={index} style={{
                          background: 'var(--bg-card)',
                          padding: '15px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: '1px solid var(--border)',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(`/challenge/${id}/proofs`, '_blank')}
                        title="Нажмите для открытия в новом окне">
                          {proof.file_type === 'image' ? (
                            <img 
                              src={fileUrl} 
                              alt={`Доказательство ${index + 1}`}
                              style={{ 
                                width: '100%', 
                                height: '120px', 
                                objectFit: 'cover',
                                borderRadius: '6px',
                                marginBottom: '8px'
                              }}
                              onError={(e) => {
                                console.error('❌ Ошибка загрузки изображения:', fileUrl);
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=Ошибка+загрузки';
                              }}
                            />
                          ) : proof.file_type === 'video' ? (
                            <div style={{
                              width: '100%',
                              height: '120px',
                              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '24px',
                              marginBottom: '8px'
                            }}>
                              🎥 Видео
                            </div>
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '120px',
                              background: 'linear-gradient(135deg, var(--success), #10b981)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '24px',
                              marginBottom: '8px'
                            }}>
                              📄 Документ
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {proof.file_type === 'image' ? 'Фото' : 
                             proof.file_type === 'video' ? 'Видео' : 'Документ'}
                            <br/>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {proofs.length > 3 && (
                      <div 
                        style={{
                          background: 'var(--bg-card)',
                          padding: '15px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(`/challenge/${id}/proofs`, '_blank')}
                        title="Нажмите для открытия в новом окне"
                      >
                        <div style={{
                          width: '100%',
                          height: '120px',
                          background: 'linear-gradient(135deg, var(--warning), #f59e0b)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '32px',
                          marginBottom: '8px'
                        }}>
                          +{proofs.length - 3}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Еще {proofs.length - 3} доказательств
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <Link 
                      to={`/challenge/${id}/proofs`}
                      style={{ 
                        color: 'var(--primary)', 
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      📂 Открыть все доказательства в отдельном окне →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 📋 Блок решений модерации */}
            {reviews.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>📋 История модерации</h3>
                <div style={{
                  background: 'var(--bg-hover)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  {reviews.map((review, index) => (
                    <div key={index} style={{
                      background: 'var(--bg-card)',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      borderLeft: `4px solid ${review.approved ? 'var(--success)' : 'var(--error)'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ 
                          color: review.approved ? 'var(--success)' : 'var(--error)',
                          fontWeight: '600'
                        }}>
                          {review.approved ? '✅ Подтверждено' : '❌ Отклонено'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {new Date(review.reviewed_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="request-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {/* Ожидающие принятия - получатель видит */}
              {challenge.status === 'pending' && isReceiver && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn-accept-challenge"
                    onClick={handleAccept}
                    style={{ padding: '12px 24px' }}
                  >
                    Принять вызов
                  </button>
                  <button 
                    className="btn-reject-challenge"
                    onClick={handleReject}
                    style={{ padding: '12px 24px' }}
                  >
                    Отклонить
                  </button>
                </div>
              )}

              {/* Ожидающие принятия - создатель видит */}
              {challenge.status === 'pending' && isCreator && (
                <button 
                  className="btn-cancel-challenge"
                  onClick={handleDelete}
                  style={{ padding: '12px 24px' }}
                >
                  Отменить челлендж
                </button>
              )}

              {/* Активный челлендж - получатель может завершить */}
              {challenge.status === 'accepted' && isReceiver && (
                <button 
                  className="btn btn-complete"
                  onClick={handleCompleteClick}
                  style={{ 
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                    padding: '12px 24px'
                  }}
                >
                  🏆 Завершить челлендж
                </button>
              )}

              {/* Ожидает подтверждения - создатель проверяет */}
              {challenge.status === 'completed' && isCreator && (
                <div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '15px',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                      📋 Челлендж ожидает вашего подтверждения
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Исполнитель загрузил {proofs.length} доказательств.
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-minimal"
                        onClick={() => window.open(`/challenge/${id}/proofs`, '_blank')}
                        style={{ 
                          padding: '10px 20px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'var(--bg-hover)';
                          e.target.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.borderColor = 'var(--border)';
                        }}
                      >
                        📂 Посмотреть доказательства
                      </button>
                      
                      <button 
                        className="btn btn-minimal-success"
                        onClick={() => handleApproveProofs('Автоматическое подтверждение')}
                        style={{ 
                          padding: '10px 20px',
                          border: '1px solid var(--success)',
                          background: 'transparent',
                          color: 'var(--success)',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                        }}
                      >
                        ✓ Подтвердить
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-minimal-error"
                        onClick={() => {
                          const comment = prompt('Укажите причину отклонения:');
                          if (comment && comment.trim()) {
                            handleRejectProofs(comment);
                          }
                        }}
                        style={{ 
                          padding: '10px 20px',
                          border: '1px solid var(--error)',
                          background: 'transparent',
                          color: 'var(--error)',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                        }}
                      >
                        ✕ Отклонить
                      </button>
                      
                      {/* Кнопка удаления для создателя */}
                      <button 
                        className="btn btn-minimal-delete"
                        onClick={handleDelete}
                        style={{ 
                          padding: '10px 20px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          opacity: 0.7
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = '1';
                          e.target.style.color = 'var(--error)';
                          e.target.style.borderColor = 'var(--error)';
                          e.target.style.background = 'rgba(239, 68, 68, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = '0.7';
                          e.target.style.color = 'var(--text-secondary)';
                          e.target.style.borderColor = 'var(--border)';
                          e.target.style.background = 'transparent';
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Финальные статусы */}
              {challenge.status === 'approved' && (
                <div style={{ 
                  color: 'var(--success)', 
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid var(--success)'
                }}>
                  🎉 Челлендж успешно завершен и подтвержден!
                  {proofs.length > 0 && (
                    <Link 
                      to={`/challenge/${id}/proofs`}
                      className="btn btn-outline"
                      style={{ marginLeft: 'auto', padding: '8px 16px' }}
                    >
                      Посмотреть доказательства
                    </Link>
                  )}
                </div>
              )}

              {challenge.status === 'rejected' && (
                <div style={{ 
                  color: 'var(--error)', 
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid var(--error)'
                }}>
                  Челлендж отклонен
                </div>
              )}

              {/* Кнопка удаления для создателя в любом статусе (если не в состоянии подтверждения) */}
              {isCreator && challenge.status !== 'completed' && challenge.status !== 'pending' && (
                <div style={{ 
                  marginTop: '15px', 
                  paddingTop: '15px', 
                  borderTop: '1px dashed var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button 
                    className="btn btn-minimal-delete"
                    onClick={handleDelete}
                    style={{ 
                      padding: '8px 16px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: 0.7
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.color = 'var(--error)';
                      e.target.style.borderColor = 'var(--error)';
                      e.target.style.background = 'rgba(239, 68, 68, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '0.7';
                      e.target.style.color = 'var(--text-secondary)';
                      e.target.style.borderColor = 'var(--border)';
                      e.target.style.background = 'transparent';
                    }}
                  >
                    🗑️ Удалить челлендж
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модалка завершения челленджа */}
      {showCompleteModal && (
        <CompleteChallengeModal
          challenge={challenge}
          onClose={() => setShowCompleteModal(false)}
          onComplete={handleCompleteSubmit}
        />
      )}
    </div>
  );
};

export default ChallengeDetail;