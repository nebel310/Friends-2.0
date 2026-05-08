import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { useNotification } from '../context/NotificationContext'
import { api } from '../services/api'

export default function FriendRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { showNotification } = useNotification()
  const { modal, confirm } = useModal()

  const loadRequests = async () => {
    try {
      const data = await api.get('/friends/get_requests')
      setRequests(data || [])
    } catch (error) {
      showNotification('Ошибка загрузки заявок: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [])

  const acceptRequest = async (friendshipId) => {
    try {
      await api.patch(`/friends/${friendshipId}/accept`)
      showNotification('Заявка принята!', 'success')
      loadRequests()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const rejectRequest = async (friendshipId) => {
    const ok = await confirm('Отклонить заявку в друзья?', 'Отклонение заявки')
    if (!ok) return
    try {
      await api.delete(`/friends/${friendshipId}`)
      showNotification('Заявка отклонена', 'info')
      loadRequests()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  return (
    <>
      <Header />
      {modal && <Modal {...modal} />}
      <div className="page">
        <h2>Заявки в друзья</h2>

        <div className="section">
          <h3>Входящие заявки</h3>
          {loading ? (
            <div className="loading">Загрузка заявок...</div>
          ) : requests.length === 0 ? (
            <div className="list-item">Нет входящих заявок</div>
          ) : (
            requests.map(req => (
              <div key={req.friendship_id} className="list-item">
                <div><strong>{req.username}</strong></div>
                <div className="list-item-actions">
                  <button
                    className="btn btn-success btn-small"
                    onClick={() => acceptRequest(req.friendship_id)}
                  >
                    Принять
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => rejectRequest(req.friendship_id)}
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
