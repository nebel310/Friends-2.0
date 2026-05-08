import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function Header() {
  const { user, logout } = useAuth()
  const { showNotification } = useNotification()
  const navigate = useNavigate()
  const [requestsCount, setRequestsCount] = useState(0)

  useEffect(() => {
    if (!user) return
    api.get('/friends/get_requests').then(requests => {
      if (requests && requests.length > 0) setRequestsCount(requests.length)
    }).catch(() => {})
  }, [user])

  const handleLogout = async () => {
    await logout()
    showNotification('Вы вышли из аккаунта', 'info')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="header">
      <h1>
        <Link to="/landing" style={{ textDecoration: 'none', color: 'inherit' }}>Friends 2.0</Link>
      </h1>
      <nav>
        <Link to="/friends">Друзья</Link>
        <Link to="/friend-requests">
          Заявки{' '}
          {requestsCount > 0 && (
            <span className="notification-badge">{requestsCount}</span>
          )}
        </Link>
        <Link to="/challenges">Челленджи</Link>
        <Link to="/profile">Профиль</Link>
        <Link to="/users">Все пользователи</Link>
        {user.role === 'admin' && <Link to="/admin" className="admin-nav-link">Админка</Link>}
      </nav>
      <button onClick={handleLogout} className="btn btn-danger logout-btn">Выйти</button>
    </div>
  )
}
