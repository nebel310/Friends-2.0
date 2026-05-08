import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [bannedUsers, setBannedUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const { showNotification } = useNotification()
  const { user } = useAuth()
  const { modal, confirm } = useModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    if (user.role !== 'admin') {
      showNotification('Доступ запрещён', 'error')
      navigate('/friends')
      return
    }
    loadAll()
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [all, banned] = await Promise.all([
        api.get('/admin/users?include_banned=true&include_invisible=true'),
        api.get('/admin/users/banned'),
      ])
      const allList = all?.users || all || []
      const bannedList = banned || []
      setUsers(allList)
      setBannedUsers(bannedList)
      setStats({
        'Всего пользователей': allList.length,
        'Администраторов': allList.filter(u => u.role === 'admin').length,
        'Забаненных': bannedList.length,
        'Активных': allList.filter(u => u.role === 'user' && u.is_visible).length,
      })
    } catch (error) {
      showNotification('Ошибка загрузки данных: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (userId, username) => {
    const ok = await confirm(`Забанить пользователя ${username}?`, 'Бан пользователя')
    if (!ok) return
    try {
      await api.post(`/admin/users/${userId}/role`, { role: 'banned' })
      showNotification(`${username} забанен`, 'success')
      loadAll()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const handleUnban = async (userId, username) => {
    const ok = await confirm(`Разбанить пользователя ${username}?`, 'Разбан пользователя')
    if (!ok) return
    try {
      await api.post(`/admin/users/${userId}/role`, { role: 'user' })
      showNotification(`${username} разбанен`, 'success')
      loadAll()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const handleSetRole = async (userId, role) => {
    try {
      await api.post(`/admin/users/${userId}/role`, { role })
      showNotification('Роль обновлена', 'success')
      loadAll()
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const filtered = users.filter(u =>
    !searchQ || u.username?.toLowerCase().includes(searchQ.toLowerCase()) || u.email?.toLowerCase().includes(searchQ.toLowerCase())
  )

  if (loading) return <><Header /><div className="loading">Загрузка...</div></>

  return (
    <>
      <Header />
      {modal && <Modal {...modal} />}
      <div className="page">
        <div className="section">
          <h2>Админ-панель</h2>
          <div className="admin-nav">
            {['users', 'banned', 'stats'].map(tab => (
              <button key={tab} className={`admin-nav-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'users' ? 'Все пользователи' : tab === 'banned' ? 'Забаненные' : 'Статистика'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="section">
            <h3>Все пользователи</h3>
            <div className="admin-filters">
              <input
                type="text" placeholder="Поиск по имени или email..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', maxWidth: 300 }}
              />
            </div>
            {filtered.map(u => (
              <div key={u.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <strong>{u.username}</strong>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {u.email} | Роль: {u.role} | {u.is_confirmed ? '✅ email' : '❌ email'}
                  </div>
                </div>
                <div className="list-item-actions">
                  <select
                    value={u.role}
                    onChange={e => handleSetRole(u.id, e.target.value)}
                    style={{ padding: '0.3rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="btn btn-danger btn-small" onClick={() => handleBan(u.id, u.username)}>Бан</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'banned' && (
          <div className="section">
            <h3>Забаненные пользователи</h3>
            {bannedUsers.length === 0 ? (
              <div className="list-item">Нет забаненных пользователей</div>
            ) : (
              bannedUsers.map(u => (
                <div key={u.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <strong>{u.username}</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-success btn-small" onClick={() => handleUnban(u.id, u.username)}>Разбанить</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="section">
            <h3>Статистика</h3>
            <div className="stats-grid">
              {Object.entries(stats).map(([key, val]) => (
                <div key={key} className="stat-card">
                  <div className="stat-title">{key.replace(/_/g, ' ')}</div>
                  <div className="stat-value">{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
