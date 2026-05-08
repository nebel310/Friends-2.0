import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '../components/Header'
import { useNotification } from '../context/NotificationContext'
import { api } from '../services/api'

const PAGE_SIZE = 12

export default function Users() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [myFriends, setMyFriends] = useState([])
  const [myIncomingRequests, setMyIncomingRequests] = useState([])
  const [filters, setFilters] = useState({ q: '', gender: '', min_age: '', max_age: '' })
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const { showNotification } = useNotification()
  const observerRef = useRef(null)
  const bottomRef = useRef(null)

  const loadFriendsAndRequests = useCallback(async () => {
    try {
      const [friends, incoming] = await Promise.all([
        api.get('/friends/?limit=1000&offset=0'),
        api.get('/friends/get_requests'),
      ])
      setMyFriends((friends || []).map(f => f.id))
      setMyIncomingRequests((incoming || []).map(r => r.user_id))
    } catch {}
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const data = await api.get('/users/stats')
      setStats(data)
    } catch {}
  }, [])

  const loadUsers = useCallback(async (currentPage, currentFilters, reset = false) => {
    const params = new URLSearchParams()
    params.append('limit', PAGE_SIZE)
    params.append('offset', currentPage * PAGE_SIZE)
    if (currentFilters.q) params.append('q', currentFilters.q)
    if (currentFilters.gender) params.append('gender', currentFilters.gender)
    if (currentFilters.min_age) params.append('min_age', currentFilters.min_age)
    if (currentFilters.max_age) params.append('max_age', currentFilters.max_age)

    const response = await api.get(`/users?${params.toString()}`)
    const loaded = response.users || []
    setTotal(response.total || 0)

    if (reset) setUsers(loaded)
    else setUsers(prev => [...prev, ...loaded])

    const nextOffset = (currentPage + 1) * PAGE_SIZE
    setHasMore(loaded.length === PAGE_SIZE && nextOffset < (response.total || 0))
    return loaded
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadFriendsAndRequests(), loadStats()])
      await loadUsers(0, filters, true)
      setPage(1)
      setLoading(false)
    }
    init()
  }, [])

  const handleSearch = useCallback(async (newFilters) => {
    setLoading(true)
    setPage(0)
    setHasMore(true)
    await loadFriendsAndRequests()
    await loadUsers(0, newFilters, true)
    setPage(1)
    setLoading(false)
  }, [loadUsers, loadFriendsAndRequests])

  useEffect(() => {
    if (!bottomRef.current || !hasMore || loading) return
    observerRef.current = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && !loadingMore) {
        setLoadingMore(true)
        await loadUsers(page, filters)
        setPage(p => p + 1)
        setLoadingMore(false)
      }
    }, { threshold: 0.1 })
    observerRef.current.observe(bottomRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, loadingMore, page, filters, loadUsers])

  const sendFriendRequest = async (userId) => {
    try {
      await api.post('/friends/request', { user_id: userId })
      showNotification('Заявка отправлена!', 'success')
      setMyIncomingRequests(prev => [...prev, userId])
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error')
    }
  }

  const getFriendStatus = (userId) => {
    if (myFriends.includes(userId)) return 'friend'
    if (myIncomingRequests.includes(userId)) return 'incoming'
    return 'none'
  }

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    handleSearch(filters)
  }

  const handleSearchInput = (e) => {
    const newFilters = { ...filters, q: e.target.value }
    setFilters(newFilters)
    clearTimeout(window._searchTimer)
    window._searchTimer = setTimeout(() => handleSearch(newFilters), 500)
  }

  return (
    <>
      <Header />
      <div className="page">
        <div className="section">
          <div className="compact-search-container">
            <div className="compact-search-header">
              <h2 style={{ margin: 0, flex: 1 }}>
                Поиск пользователей
                {total > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>({total})</span>}
              </h2>
              <div className="compact-search-box">
                <div className="search-input-wrapper">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text" placeholder="Поиск по имени или описанию..."
                    value={filters.q} onChange={handleSearchInput}
                  />
                </div>
                <button className="btn btn-small filters-toggle" onClick={() => setFiltersVisible(v => !v)}>
                  <i className="fas fa-filter"></i> Фильтры
                </button>
              </div>
            </div>

            {filtersVisible && (
              <form className="filters-dropdown" style={{ display: 'block' }} onSubmit={handleFilterSubmit}>
                <div className="filters-content">
                  <div className="filter-row">
                    <div className="filter-group">
                      <label>Пол</label>
                      <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                        <option value="">Все</option>
                        <option value="male">Мужчины</option>
                        <option value="female">Женщины</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Мин. возраст</label>
                      <input type="number" name="min_age" placeholder="0" min="0" max="150" value={filters.min_age} onChange={handleFilterChange} />
                    </div>
                    <div className="filter-group">
                      <label>Макс. возраст</label>
                      <input type="number" name="max_age" placeholder="150" min="0" max="150" value={filters.max_age} onChange={handleFilterChange} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-small">Применить</button>
                  <button type="button" className="btn btn-small btn-secondary" onClick={() => {
                    const reset = { q: '', gender: '', min_age: '', max_age: '' }
                    setFilters(reset)
                    handleSearch(reset)
                  }}>Сбросить</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {stats && (
          <div className="section" id="stats-container">
            <div className="stats-grid" id="stats-grid">
              <div className="stat-card"><div className="stat-title">Всего пользователей</div><div className="stat-value">{stats.total_users}</div></div>
              <div className="stat-card"><div className="stat-title">Мужчины</div><div className="stat-value">{stats.male_users}</div></div>
              <div className="stat-card"><div className="stat-title">Женщины</div><div className="stat-value">{stats.female_users}</div></div>
            </div>
          </div>
        )}

        <div id="users-container">
          {loading ? (
            <div className="loading">Загрузка пользователей...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">Пользователи не найдены</div>
          ) : (
            <div className="users-grid">
              {users.map(user => {
                const status = getFriendStatus(user.id)
                return (
                  <div key={user.id} className="user-card">
                    <div className="user-card-avatar">
                      {user.has_avatar ? (
                        <img src={`/api/profile/avatar/${user.id}`} alt={user.username} className="avatar-img" />
                      ) : (
                        <div className="avatar-placeholder"><i className="fas fa-user"></i></div>
                      )}
                    </div>
                    <div className="user-card-info">
                      <h3 className="user-card-name">{user.username}</h3>
                      {user.bio && <p className="user-card-bio">{user.bio}</p>}
                    </div>
                    <div className="user-card-actions">
                      {status === 'friend' && <span className="badge badge-success">Друг</span>}
                      {status === 'incoming' && <span className="badge badge-warning">Заявка отправлена</span>}
                      {status === 'none' && (
                        <button className="btn btn-small" onClick={() => sendFriendRequest(user.id)}>
                          Добавить в друзья
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {loadingMore && <div className="loading" style={{ padding: '1rem' }}>Загрузка...</div>}
          {!hasMore && users.length > 0 && <div id="no-more-results" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>Все пользователи загружены</div>}
          <div ref={bottomRef} style={{ height: '1px' }} />
        </div>
      </div>
    </>
  )
}
