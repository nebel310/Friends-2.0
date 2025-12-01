import React, { useState, useRef } from 'react';
import { apiService } from '../../services/api';

const CompleteChallengeModal = ({ challenge, onClose, onComplete }) => {
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Проверяем размер файлов (макс 10MB)
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('❌ Некоторые файлы превышают 10MB');
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      if (!window.confirm('Вы не добавили доказательств. Завершить без доказательств?')) {
        return;
      }
    }

    setUploading(true);
    setProgress(0);

    try {
      console.log('🚀 Начинаю завершение челленджа...');
      
      if (files.length > 0) {
        // Используем комплексный метод с загрузкой файлов
        await apiService.completeChallengeWithProofs(challenge.id, files, description);
      } else {
        // Просто завершаем без доказательств
        await apiService.completeChallenge(challenge.id);
      }
      
      console.log('✅ Челлендж успешно завершен');
      onComplete('success', { files, description });
    } catch (error) {
      console.error('❌ Ошибка завершения челленджа:', error);
      alert(`Ошибка: ${error.message}`);
      setUploading(false);
    }
  };

  const getFileTypeIcon = (file) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>🏆 Завершить челлендж</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={uploading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-info" style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', fontSize: '14px' }}>
              📋 Информация о челлендже
            </h4>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div><strong>Название:</strong> {challenge.title}</div>
              <div><strong>Статус:</strong> {challenge.status}</div>
              <div><strong>Создатель:</strong> {challenge.created_by?.username}</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="completion-description">Описание выполнения (необязательно):</label>
            <textarea
              id="completion-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите как вы выполнили челлендж, какие были сложности, что получилось..."
              className="form-input"
              rows="4"
              disabled={uploading}
              maxLength={500}
            />
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              marginTop: '5px' 
            }}>
              Символов: {description.length}/500
            </div>
          </div>

          <div className="form-group">
            <label>📎 Доказательства выполнения:</label>
            
            {/* Drag & Drop зона */}
            <div 
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                marginBottom: '15px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: 'var(--bg-hover)',
                transition: 'all 0.3s'
              }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!uploading) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  handleFileChange({ target: { files: e.dataTransfer.files } });
                }
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
              <div style={{ marginBottom: '5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Перетащите файлы сюда
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>
                или нажмите для выбора
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                Поддерживаются: изображения (JPEG, PNG), видео (MP4)
                <br/>
                Максимальный размер: 10MB на файл
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*"
              style={{ display: 'none' }}
              disabled={uploading}
            />

            {/* Список выбранных файлов */}
            {files.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-muted)', 
                  marginBottom: '10px' 
                }}>
                  Выбрано файлов: {files.length}
                </div>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  {files.map((file, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: 'var(--bg-hover)',
                        borderRadius: '6px',
                        marginBottom: '5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{getFileTypeIcon(file)}</span>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '5px'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Прогресс загрузки */}
            {uploading && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}>
                  <span>Загрузка файлов...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: 'var(--bg-hover)',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                      transition: 'width 0.3s',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Подсказки */}
          <div className="modal-info" style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--success)', fontSize: '14px' }}>
              💡 Рекомендации по доказательствам:
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <li>Добавьте фотографии или видео выполнения</li>
              <li>Убедитесь, что доказательства соответствуют заданию</li>
              <li>Можно добавить несколько файлов за раз</li>
              <li>Создатель челленджа проверит ваши доказательства</li>
            </ul>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-error"
              onClick={onClose}
              disabled={uploading}
            >
              Отменить
            </button>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Загрузка...
                </>
              ) : (
                <>
                  <span style={{ marginRight: '8px' }}>🏆</span>
                  Отправить на проверку
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteChallengeModal;