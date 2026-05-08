import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
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

export default function Challenges() {
  const [challenges, setChallenges] = useState([])
  const [friends, setFriends] = useState([])
  const [friendFilter, setFriendFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const { showNotification } = useNotification()
  const { user } = useAuth()

  const loadChallenges = async (friendshipId = '', status = '') => {
    try {
      let url = '/challenges'
      const params = []
      if (friendshipId) params.push(`friendship_id=${friendshipId}`)
      if (status) params.push(`status=${status}`)
      if (params.length > 0) url += '?' + params.join('&')
      const data = await api.get(url)
      setChallenges(data || [])
    } catch (error) {
      showNotification('Ошибка загрузки челленджей: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    try {
      const data = await api.get('/friends/?limit=100&offset=0')
      setFriends(data || [])
    } catch {}
  }

  useEffect(() => {
    loadFriends()
    loadChallenges()
  }, [])

  const handleFilterChange = () => {
    setLoading(true)
    loadChallenges(friendFilter, statusFilter)
  }

  return (
    <>
      <Header />
      <div className="page">
        <div className="section">
          <h2>Мои челленджи</h2>
          <Link to="/challenges/create" className="btn">Создать челлендж</Link>
        </div>

        <div className="section">
          <h3>Фильтры</h3>
          <div className="filter-section">
            <div className="form-group">
              <select value={friendFilter} onChange={e => setFriendFilter(e.target.value)}>
                <option value="">Все друзья</option>
                {friends.map(f => (
                  <option key={f.friendship_id} value={f.friendship_id}>{f.username}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Все статусы</option>
                <option value="pending">Ожидают принятия</option>
                <option value="accepted">Принятые</option>
                <option value="completed">На проверке</option>
                <option value="approved">Завершённые</option>
                <option value="rejected">Отклонённые</option>
              </select>
            </div>
            <button className="btn btn-small" onClick={handleFilterChange}>Применить</button>
          </div>
        </div>

        <div className="section">
          <h3>Список челленджей</h3>
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : challenges.length === 0 ? (
            <div className="list-item">Челленджей не найдено</div>
          ) : (
            challenges.map(ch => {
              const isCreator = user && ch.created_by?.id === user.id
              return (
                <div key={ch.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div><strong>{ch.title}</strong></div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Статус: <span className={`challenge-status status-${ch.status}`}>{STATUS_LABELS[ch.status] || ch.status}</span>
                      {' | '}
                      {isCreator ? 'Вы создали' : `От: ${ch.created_by?.username}`}
                      {' | '}
                      {new Date(ch.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <Link to={`/challenges/${ch.id}`} className="btn btn-small">Подробнее</Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
