import React, { useState } from 'react';

const ReviewProofsModal = ({ challenge, proofs, onClose, onApprove, onReject }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(comment || 'Доказательства приняты');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert('Пожалуйста, укажите причину отклонения');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReject(comment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProofFileUrl = (fileUrl) => {
    if (fileUrl && fileUrl.startsWith('/files/download/')) {
      return `http://localhost:3001${fileUrl}`;
    }
    return fileUrl;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>🔍 Проверка доказательств</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <div className="modal-info" style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', fontSize: '14px' }}>
            📋 Информация о челлендже
          </h4>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div><strong>Название:</strong> {challenge.title}</div>
            <div><strong>Описание:</strong> {challenge.description || 'Без описания'}</div>
            <div><strong>Исполнитель:</strong> {challenge.created_by?.username}</div>
            <div><strong>Доказательств:</strong> {proofs.length}</div>
          </div>
        </div>

        {/* Доказательства */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>
            📸 Доказательства ({proofs.length})
          </h3>
          
          {proofs.length === 0 ? (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              background: 'var(--bg-hover)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Доказательства не предоставлены
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Исполнитель завершил челлендж без доказательств
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '15px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '10px',
              background: 'var(--bg-hover)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              {proofs.map((proof, index) => {
                const fileUrl = getProofFileUrl(proof.file_url);
                
                return (
                  <div 
                    key={index}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onClick={() => window.open(fileUrl, '_blank')}
                  >
                    {proof.file_type === 'image' ? (
                      <img 
                        src={fileUrl} 
                        alt={`Доказательство ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/180x120?text=Ошибка+загрузки';
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '120px',
                        background: proof.file_type === 'video' 
                          ? 'linear-gradient(135deg, var(--primary), var(--primary-light))'
                          : 'linear-gradient(135deg, var(--success), #10b981)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px'
                      }}>
                        {proof.file_type === 'video' ? '🎥' : '📄'}
                        <div style={{ fontSize: '12px', marginTop: '5px' }}>
                          {proof.file_type === 'video' ? 'Видео' : 'Документ'}
                        </div>
                      </div>
                    )}
                    <div style={{
                      padding: '10px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      background: 'var(--bg-hover)'
                    }}>
                      Доказательство #{index + 1}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Нажмите для открытия
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Комментарий */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>💬 Комментарий (опционально)</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Оставьте комментарий к вашему решению..."
            className="form-input"
            rows="3"
            disabled={isSubmitting}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
            {isSubmitting ? 'Отправка...' : 'Обязательно для отклонения, рекомендуется для подтверждения'}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button 
            type="button" 
            className="btn btn-error"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: '12px 24px' }}
          >
            Отменить проверку
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-error"
              onClick={handleReject}
              disabled={isSubmitting}
              style={{ padding: '12px 24px' }}
            >
              {isSubmitting ? '⏳' : '❌'} Отклонить
            </button>
            
            <button 
              type="button" 
              className="btn btn-success"
              onClick={handleApprove}
              disabled={isSubmitting}
              style={{ padding: '12px 24px' }}
            >
              {isSubmitting ? '⏳' : '✅'} Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewProofsModal;