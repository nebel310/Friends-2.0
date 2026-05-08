import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const STATUS_LABELS = {
  pending: 'Ожидает принятия',
  accepted: 'В процессе выполнения',
  completed: 'На проверке',
  approved: 'Завершён',
  rejected: 'Отклонён',
}

export default function ChallengeDetail() {
  const { id } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const { showNotification } = useNotification()
  const { user } = useAuth()
  const { modal, confirm } = useModal()

  const load = async () => {
    try {
      const [ch, reviews] = await Promise.all([
        api.get(`/challenges/${id}`),
        api.get(`/reviews/challenges/${id}?limit=100&offset=0`).catch(() => ({ reviews: [] })),
      ])
      setChallenge(ch)
      setHistory(reviews.reviews || [])
    } catch (error) {
      showNotification('Ошибка загрузки: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleAccept = async () => {
    const ok = await confirm('Принять этот челлендж?')
    if (!ok) return
    try {
      await api.post(`/challenges/${id}/accept`)
      showNotification('Челлендж принят! Теперь вы можете его выполнять.', 'success')
      load()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const handleComplete = async () => {
    if (!challenge?.proofs || challenge.proofs.length === 0) {
      showNotification('Добавьте хотя бы одно доказательство перед отправкой на проверку', 'error')
      return
    }
    const ok = await confirm('Отправить на проверку?')
    if (!ok) return
    try {
      await api.post(`/challenges/${id}/complete`)
      showNotification('Челлендж отправлен на проверку!', 'success')
      load()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const handleApprove = async () => {
    const ok = await confirm('Одобрить выполнение челленджа?')
    if (!ok) return
    try {
      await createReview(true, 'Отличная работа! Челлендж выполнен успешно.')
      showNotification('Челлендж принят! Задание завершено.', 'success')
      load()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const handleRejectReview = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }
    const comment = rejectComment.trim() || 'К сожалению, доказательства недостаточны. Попробуйте еще раз.'
    try {
      await createReview(false, comment)
      showNotification('Выполнение отклонено. Челлендж возвращён на доработку.', 'success')
      setShowRejectInput(false)
      setRejectComment('')
      load()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const createReview = async (approved, comment) => {
    try {
      await api.post(`/reviews/challenges/${id}`, { approved, comment })
    } catch (error) {
      if (error.message.includes('уже существует')) {
        const reviews = await api.get(`/reviews/challenges/${id}?limit=100&offset=0`)
        for (const r of (reviews.reviews || [])) {
          await api.delete(`/reviews/${r.id}`)
        }
        await api.post(`/reviews/challenges/${id}`, { approved, comment })
      } else {
        throw error
      }
    }
  }

  const handleProofUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const uploaded = await api.uploadFile(file, 'proofs')
      await api.post(`/challenges/${id}/proofs`, [{ file_url: uploaded.url, file_type: uploaded.file_type || 'image' }])
      showNotification('Доказательство добавлено!', 'success')
      load()
    } catch (error) {
      showNotification('Ошибка загрузки: ' + error.message, 'error')
    }
    e.target.value = ''
  }

  const handleDeleteProof = async (proofId) => {
    const ok = await confirm('Удалить это доказательство?')
    if (!ok) return
    try {
      await api.delete(`/challenges/${id}/proofs/${proofId}`)
      showNotification('Доказательство удалено', 'info')
      load()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  if (loading) return <><Header /><div className="loading">Загрузка...</div></>
  if (!challenge) return <><Header /><div className="page"><p>Челлендж не найден</p><Link to="/challenges" className="btn">Назад</Link></div></>

  const isCreator = user && challenge.created_by?.id === user.id
  const canAccept = !isCreator && challenge.status === 'pending'
  const canComplete = !isCreator && (challenge.status === 'accepted' || challenge.status === 'rejected')
  const canUploadProof = !isCreator && (challenge.status === 'accepted' || challenge.status === 'rejected')
  const canApprove = isCreator && challenge.status === 'completed'
  const canRejectReview = isCreator && challenge.status === 'completed'

  return (
    <>
      <Header />
      {modal && <Modal {...modal} />}
      <div className="page">
        <div className="section">
          <h2>{challenge.title}</h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Статус:</strong>{' '}
            <span className={`challenge-status status-${challenge.status}`}>
              {STATUS_LABELS[challenge.status] || challenge.status}
            </span>
          </div>
          {challenge.description && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Описание:</strong>
              <div className="description-wrapper">{challenge.description}</div>
            </div>
          )}
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>{isCreator ? 'Вы создали этот челлендж' : `От: ${challenge.created_by?.username}`}</strong>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Создан: {new Date(challenge.created_at).toLocaleString()}
          </div>
          {challenge.completed_at && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Завершён: {new Date(challenge.completed_at).toLocaleString()}
            </div>
          )}
        </div>

        <div className="section">
          <h3>Доказательства выполнения</h3>
          {(!challenge.proofs || challenge.proofs.length === 0) ? (
            <div className="list-item">Доказательств пока нет</div>
          ) : (
            challenge.proofs.map(proof => (
              <div key={proof.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <strong>{proof.file_type === 'image' ? '🖼️ Изображение' : '🎥 Видео'}</strong>
                  {proof.file_type === 'image' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img src={proof.file_url} alt="Доказательство" style={{ maxWidth: 300, maxHeight: 300, borderRadius: 4 }} />
                    </div>
                  )}
                  {proof.file_type === 'video' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <video controls style={{ maxWidth: 300, maxHeight: 300, borderRadius: 4 }}>
                        <source src={proof.file_url} type="video/mp4" />
                      </video>
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href={proof.file_url} download className="btn btn-small">Скачать оригинал</a>
                  </div>
                </div>
                {canUploadProof && (
                  <button className="btn btn-danger btn-small" onClick={() => handleDeleteProof(proof.id)}>Удалить</button>
                )}
              </div>
            ))
          )}

          {canUploadProof && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Загрузить доказательство</h4>
              <label className="btn" style={{ cursor: 'pointer' }}>
                <i className="fas fa-upload"></i> Выбрать файл (JPEG, PNG, MP4)
                <input type="file" accept="image/jpeg,image/png,video/mp4" style={{ display: 'none' }} onChange={handleProofUpload} />
              </label>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="section">
            <h3>История проверок</h3>
            {history.map((review, i) => (
              <div key={i} className="list-item" style={{ borderLeft: `4px solid ${review.approved ? '#10b981' : '#ef4444'}`, paddingLeft: '1rem' }}>
                <div>
                  <strong>{review.approved ? '✅ Принято' : '❌ Отклонено'}</strong>
                  {review.comment && <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{review.comment}</div>}
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {new Date(review.reviewed_at || review.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {canAccept && <button className="btn btn-success" onClick={handleAccept}>Принять челлендж</button>}
            {canComplete && (
              <button className="btn" onClick={handleComplete} disabled={!challenge.proofs?.length}>
                {challenge.status === 'rejected' ? 'Отправить на повторную проверку' : 'Отправить на проверку'}
              </button>
            )}
            {canApprove && <button className="btn btn-success" onClick={handleApprove}>Принять выполнение</button>}
            {canRejectReview && (
              <div>
                <button className="btn btn-danger" onClick={handleRejectReview}>
                  {showRejectInput ? 'Подтвердить отклонение' : 'Отклонить выполнение'}
                </button>
                {showRejectInput && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label>Комментарий к отклонению:</label>
                    <textarea
                      rows={3} style={{ width: '100%', marginTop: '0.5rem' }}
                      placeholder="Укажите причину отклонения..."
                      value={rejectComment} onChange={e => setRejectComment(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            <Link to="/challenges" className="btn btn-secondary">← Назад</Link>
          </div>
        </div>
      </div>
    </>
  )
}
