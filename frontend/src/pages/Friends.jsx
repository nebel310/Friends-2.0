import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { useNotification } from '../context/NotificationContext'
import { api } from '../services/api'

export default function Friends() {
  const [friends, setFriends] = useState([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const { showNotification } = useNotification()
  const { modal, confirm } = useModal()

  const loadFriends = async () => {
    try {
      const data = await api.get('/friends/?limit=100&offset=0')
      setFriends(data || [])
    } catch (error) {
      showNotification('Ошибка загрузки списка друзей: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFriends() }, [])

  const sendRequest = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    try {
      await api.post('/friends/request', { username_or_email: username })
      showNotification('Заявка отправлена!', 'success')
      setUsername('')
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const removeFriend = async (friendshipId) => {
    const ok = await confirm('Вы уверены, что хотите удалить этого друга?', 'Удаление друга')
    if (!ok) return
    try {
      await api.delete(`/friends/${friendshipId}`)
      showNotification('Друг удалён', 'success')
      loadFriends()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  return (
    <>
      <Header />
      {modal && <Modal {...modal} />}
      <div className="page">
        <h2>Мои друзья</h2>

        <div className="section">
          <h3>Добавить друга</h3>
          <form onSubmit={sendRequest}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Имя пользователя или email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn">Отправить заявку</button>
          </form>
        </div>

        <div className="section">
          <h3>Список друзей</h3>
          {loading ? (
            <div className="loading">Загрузка друзей...</div>
          ) : friends.length === 0 ? (
            <div className="list-item">У вас пока нет друзей</div>
          ) : (
            friends.map(friend => (
              <div key={friend.friendship_id} className="list-item">
                <div><strong>{friend.username}</strong></div>
                <div className="list-item-actions">
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => removeFriend(friend.friendship_id)}
                  >
                    Удалить
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
