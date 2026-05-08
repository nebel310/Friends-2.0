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

  const acceptRequest = async (requestId) => {
    try {
      await api.patch(`/friends/requests/${requestId}/accept`)
      showNotification('Заявка принята!', 'success')
      loadRequests()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const rejectRequest = async (requestId) => {
    const ok = await confirm('Отклонить заявку в друзья?', 'Отклонение заявки')
    if (!ok) return
    try {
      await api.delete(`/friends/requests/${requestId}/delete`)
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
              <div key={req.id} className="list-item">
                <div><strong>{req.username}</strong> отправил(а) вам заявку в друзья</div>
                <div className="list-item-actions">
                  <button className="btn btn-success btn-small" onClick={() => acceptRequest(req.id)}>
                    Принять
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => rejectRequest(req.id)}>
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
