import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import Sidebar from '../Layout/Sidebar';

const ProofsViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [challenge, setChallenge] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadChallengeAndProofs();
  }, [id]);

  const loadChallengeAndProofs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getChallengeDetail(id);
      console.log('📦 Загружен челлендж для просмотра:', data);
      setChallenge(data);
      setProofs(data.proofs || []);
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
    } finally {
      setLoading(false);
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

  const handleDownload = (proof) => {
    const fileUrl = getProofFileUrl(proof.file_url);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `proof_${proof.id || Date.now()}.${proof.file_type === 'image' ? 'jpg' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : proofs.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < proofs.length - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <div className="loading-spinner">Загрузка доказательств...</div>
        </div>
      </div>
    );
  }

  if (!challenge || proofs.length === 0) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <div className="empty-state-content">
            <div className="empty-icon-large">📭</div>
            <h2 className="empty-title">Доказательства не найдены</h2>
            <p className="empty-description">
              Для этого челленджа не загружены доказательства.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/challenge/${id}`)}
            >
              ← Назад к челленджу
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentProof = proofs[currentIndex];
  const fileUrl = getProofFileUrl(currentProof.file_url);
  const isImage = currentProof.file_type === 'image';

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          {/* Минималистичная кнопка назад */}
          <div style={{ 
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button 
              onClick={() => navigate(`/challenge/${id}`)}
              style={{ 
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--bg-hover)';
                e.target.style.color = 'var(--text-primary)';
                e.target.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--text-secondary)';
                e.target.style.borderColor = 'var(--border)';
              }}
            >
              <span style={{ fontSize: '16px' }}>←</span>
              <span>Вернуться к челленджу</span>
            </button>
          </div>

          {/* Заголовок */}
          <div style={{ 
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: '12px',
              fontSize: '28px',
              fontWeight: '600'
            }}>
              📸 Доказательства выполнения
            </h1>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Челлендж:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{challenge.title}</strong>
              </div>
              <div style={{ 
                height: '16px',
                width: '1px',
                background: 'var(--border)'
              }}></div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Доказательств:</span>{' '}
                <strong style={{ color: 'var(--primary)' }}>{proofs.length}</strong>
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="card" style={{ 
            padding: '40px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            margin: '0 auto',
            maxWidth: '900px'
          }}>
            {/* Навигация - с увеличенными расстояниями */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '50px',
              position: 'relative',
              gap: '60px' // Увеличенное расстояние между элементами
            }}>
              {/* Левая кнопка */}
              <button 
                onClick={handlePrevious}
                disabled={proofs.length <= 1}
                style={{ 
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: proofs.length <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  cursor: proofs.length <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  opacity: proofs.length <= 1 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (proofs.length > 1) {
                    e.target.style.background = 'var(--bg-hover)';
                    e.target.style.color = 'var(--text-primary)';
                    e.target.style.borderColor = 'var(--border-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (proofs.length > 1) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                    e.target.style.borderColor = 'var(--border)';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>◀</span>
                <span>Предыдущее</span>
              </button>
              
              {/* Центральные цифры - с увеличенными расстояниями */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '15px' // Увеличенное расстояние между цифрами
              }}>
                <span style={{ 
                  background: 'var(--primary)',
                  color: 'white',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '600',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                }}>
                  {currentIndex + 1}
                </span>
                <span style={{ 
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  fontWeight: '500'
                }}>
                  из
                </span>
                <span style={{ 
                  color: 'var(--text-primary)',
                  fontSize: '24px',
                  fontWeight: '600'
                }}>
                  {proofs.length}
                </span>
              </div>
              
              {/* Правая кнопка */}
              <button 
                onClick={handleNext}
                disabled={proofs.length <= 1}
                style={{ 
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: proofs.length <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  cursor: proofs.length <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  opacity: proofs.length <= 1 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (proofs.length > 1) {
                    e.target.style.background = 'var(--bg-hover)';
                    e.target.style.color = 'var(--text-primary)';
                    e.target.style.borderColor = 'var(--border-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (proofs.length > 1) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                    e.target.style.borderColor = 'var(--border)';
                  }
                }}
              >
                <span>Следующее</span>
                <span style={{ fontSize: '18px' }}>▶</span>
              </button>
            </div>

            {/* Просмотр доказательства */}
            <div style={{ 
              marginBottom: '40px',
              display: 'flex',
              justifyContent: 'center',
              minHeight: '450px'
            }}>
              {isImage ? (
                <div style={{ 
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <img 
                    src={fileUrl}
                    alt={`Доказательство ${currentIndex + 1}`}
                    style={{
                      width: '100%',
                      maxWidth: '700px',
                      maxHeight: '550px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/800x600?text=Ошибка+загрузки+изображения';
                    }}
                  />
                </div>
              ) : currentProof.file_type === 'video' ? (
                <div style={{ 
                  width: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <video 
                    controls
                    style={{
                      width: '100%',
                      maxWidth: '700px',
                      borderRadius: '12px',
                      background: 'black',
                      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <source src={fileUrl} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </div>
              ) : (
                <div style={{ 
                  padding: '50px', 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-card) 100%)',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '500px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)'
                }}>
                  <div style={{ 
                    fontSize: '72px', 
                    marginBottom: '20px',
                    color: 'var(--text-secondary)',
                    opacity: 0.8
                  }}>
                    📄
                  </div>
                  <h3 style={{ 
                    marginBottom: '12px', 
                    color: 'var(--text-primary)',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    Документ
                  </h3>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: '30px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    Файл документа не может быть отображен в браузере.
                    Для просмотра скачайте его на устройство.
                  </p>
                </div>
              )}
            </div>

            {/* Кнопка скачивания - одна по центру */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '50px'
            }}>
              <button 
                onClick={() => handleDownload(currentProof)}
                style={{ 
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)';
                }}
              >
                <span style={{ fontSize: '18px' }}>⬇</span>
                <span>Скачать доказательство</span>
              </button>
            </div>

            {/* Миниатюры всех доказательств */}
            {proofs.length > 1 && (
              <div style={{ 
                marginTop: '50px',
                paddingTop: '40px',
                borderTop: '1px solid var(--border)'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '25px'
                }}>
                  <h3 style={{ 
                    color: 'var(--text-primary)', 
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    Все доказательства
                  </h3>
                  <div style={{ 
                    color: 'var(--text-muted)',
                    fontSize: '13px'
                  }}>
                    Нажмите для переключения
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: '15px'
                }}>
                  {proofs.map((proof, index) => (
                    <div 
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      style={{
                        background: index === currentIndex 
                          ? 'var(--bg-primary)' 
                          : 'var(--bg-hover)',
                        padding: '15px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: `2px solid ${index === currentIndex ? 'var(--primary)' : 'transparent'}`,
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Индикатор текущего */}
                      {index === currentIndex && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'var(--primary)',
                          color: 'white',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '600',
                          zIndex: '1'
                        }}>
                          ✓
                        </div>
                      )}
                      
                      {proof.file_type === 'image' ? (
                        <img 
                          src={getProofFileUrl(proof.file_url)}
                          alt={`Миниатюра ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            border: '1px solid var(--border)'
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/110x80?text=Фото';
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '80px',
                          background: proof.file_type === 'video' 
                            ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
                            : 'linear-gradient(135deg, #10b981, #34d399)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '28px',
                          marginBottom: '10px',
                          border: '1px solid var(--border)'
                        }}>
                          {proof.file_type === 'video' ? '🎥' : '📄'}
                        </div>
                      )}
                      
                      <div style={{ 
                        fontSize: '12px', 
                        color: index === currentIndex ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: index === currentIndex ? '600' : '400'
                      }}>
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofsViewer;