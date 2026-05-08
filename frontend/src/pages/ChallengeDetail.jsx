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

  const handleAction = async (action) => {
    const messages = {
      accept: 'Принять этот челлендж?',
      reject: 'Отклонить этот челлендж?',
      complete: 'Отметить как выполненный?',
      approve: 'Одобрить выполнение челленджа?',
      reject_review: 'Отклонить выполнение челленджа?',
    }
    const ok = await confirm(messages[action] || 'Подтвердить действие?')
    if (!ok) return
    try {
      await api.patch(`/challenges/${id}/${action}`)
      showNotification('Действие выполнено!', 'success')
      load()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const handleProofUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const uploaded = await api.uploadFile(file, 'proofs')
      await api.post(`/challenges/${id}/proofs`, { file_url: uploaded.url, file_type: uploaded.file_type || 'image' })
      showNotification('Доказательство загружено!', 'success')
      load()
    } catch (error) {
      showNotification('Ошибка загрузки: ' + error.message, 'error')
    }
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
  const canReject = !isCreator && challenge.status === 'pending'
  const canComplete = !isCreator && challenge.status === 'accepted'
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
        </div>

        <div className="section">
          <h3>Доказательства выполнения</h3>
          {challenge.proofs?.length === 0 ? (
            <div className="list-item">Доказательств пока нет</div>
          ) : (
            challenge.proofs?.map(proof => (
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
                    <a href={proof.file_url} download className="btn btn-small">Скачать</a>
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
                <i className="fas fa-upload"></i> Выбрать файл
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleProofUpload} />
              </label>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="section">
            <h3>История проверок</h3>
            {history.map((review, i) => (
              <div key={i} className="list-item">
                <div>
                  <strong>{review.action === 'approved' ? '✅ Одобрено' : '❌ Отклонено'}</strong>
                  {review.comment && <div style={{ color: 'var(--text-muted)' }}>{review.comment}</div>}
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(review.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canAccept && <button className="btn btn-success" onClick={() => handleAction('accept')}>Принять</button>}
            {canReject && <button className="btn btn-danger" onClick={() => handleAction('reject')}>Отклонить</button>}
            {canComplete && <button className="btn" onClick={() => handleAction('complete')}>Отметить выполненным</button>}
            {canApprove && <button className="btn btn-success" onClick={() => handleAction('approve')}>Одобрить</button>}
            {canRejectReview && <button className="btn btn-danger" onClick={() => handleAction('reject_review')}>Отклонить выполнение</button>}
            <Link to="/challenges" className="btn btn-secondary">← Назад</Link>
          </div>
        </div>
      </div>
    </>
  )
}
