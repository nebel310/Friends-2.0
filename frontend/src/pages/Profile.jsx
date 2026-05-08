import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const { showNotification } = useNotification()
  const [form, setForm] = useState({ username: '', email: '', gender: '', bio: '', birth_date: '', is_visible: true })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [avatarInfo, setAvatarInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarKey, setAvatarKey] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [me, avatar] = await Promise.all([
          api.get('/auth/me'),
          api.get('/profile/avatar').catch(() => ({ has_avatar: false })),
        ])
        setForm({
          username: me.username || '',
          email: me.email || '',
          gender: me.gender || '',
          bio: me.bio || '',
          birth_date: me.birth_date ? new Date(me.birth_date).toISOString().split('T')[0] : '',
          is_visible: me.is_visible !== false,
        })
        setAvatarInfo(avatar)
      } catch (error) {
        showNotification('Ошибка загрузки профиля: ' + error.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (!payload.birth_date) delete payload.birth_date
      await api.patch('/profile', payload)
      await refreshUser()
      showNotification('Профиль обновлён!', 'success')
    } catch (error) {
      showNotification('Ошибка обновления: ' + error.message, 'error')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showNotification('Новые пароли не совпадают', 'error')
      return
    }
    try {
      await api.patch('/profile/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirm: passwordForm.confirm_password,
      })
      showNotification('Пароль изменён!', 'success')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      showNotification('Ошибка смены пароля: ' + error.message, 'error')
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) { showNotification('Файл слишком большой. Максимум 5MB', 'error'); return }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) { showNotification('Разрешены: JPEG, PNG, GIF, WebP', 'error'); return }
    try {
      await api.uploadAvatar(file)
      setAvatarInfo({ has_avatar: true })
      setAvatarKey(k => k + 1)
      showNotification('Аватарка загружена!', 'success')
    } catch (error) {
      showNotification('Ошибка загрузки аватарки: ' + error.message, 'error')
    }
  }

  const handleAvatarDelete = async () => {
    try {
      await api.delete('/profile/avatar')
      setAvatarInfo({ has_avatar: false })
      setAvatarKey(k => k + 1)
      showNotification('Аватарка удалена', 'info')
    } catch (error) {
      showNotification('Ошибка удаления аватарки: ' + error.message, 'error')
    }
  }

  if (loading) return <><Header /><div className="loading">Загрузка профиля...</div></>

  return (
    <>
      <Header />
      <div className="page">
        <div className="section">
          <h2>Мой профиль</h2>

          {user && (
            <div className="status-cards" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div className="status-card">
                <div className="status-title">Статус аккаунта</div>
                <div className={`status-value ${user.role === 'admin' ? 'status-admin' : 'status-user'}`}>
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </div>
              </div>
              <div className="status-card">
                <div className="status-title">Email подтверждён</div>
                <div className={`status-value ${user.is_confirmed ? 'status-confirmed' : 'status-unconfirmed'}`}>
                  {user.is_confirmed ? '✅ Да' : '❌ Нет'}
                </div>
              </div>
              {user.created_at && (
                <div className="status-card">
                  <div className="status-title">Дата регистрации</div>
                  <div className="status-value">{new Date(user.created_at).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          )}

          <div className="section avatar-section">
            <h3>Аватар</h3>
            <div id="avatar-container">
              {avatarInfo?.has_avatar ? (
                <img key={avatarKey} src={`/api/profile/avatar/me?t=${avatarKey}`} alt="Аватар" className="avatar-img" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar-placeholder" style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                  <i className="fas fa-user"></i>
                </div>
              )}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <label className="btn btn-small" style={{ cursor: 'pointer' }}>
                  <i className="fas fa-upload"></i> Загрузить
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </label>
                {avatarInfo?.has_avatar && (
                  <button className="btn btn-small btn-danger" onClick={handleAvatarDelete}>
                    <i className="fas fa-trash"></i> Удалить
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Основная информация</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label>Имя пользователя:</label>
                <input type="text" name="username" required minLength={3} maxLength={50} value={form.username} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} />
                {user && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {user.is_confirmed
                      ? <span style={{ color: '#10b981' }}>✅ Email подтверждён</span>
                      : <span style={{ color: '#f59e0b' }}>⚠️ Email не подтверждён. Проверьте почту</span>}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Пол:</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <div className="form-group">
                <label>О себе:</label>
                <textarea name="bio" rows={4} maxLength={500} value={form.bio} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Дата рождения:</label>
                <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="is_visible" name="is_visible" checked={form.is_visible} onChange={handleChange} />
                <label htmlFor="is_visible">Профиль виден другим пользователям</label>
              </div>
              <button type="submit" className="btn">Сохранить изменения</button>
            </form>
          </div>

          <div className="section">
            <h3>Смена пароля</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Текущий пароль:</label>
                <input type="password" name="current_password" required value={passwordForm.current_password}
                  onChange={e => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Новый пароль:</label>
                <input type="password" name="new_password" required minLength={8} value={passwordForm.new_password}
                  onChange={e => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Подтверждение нового пароля:</label>
                <input type="password" name="confirm_password" required value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))} />
              </div>
              <button type="submit" className="btn">Сменить пароль</button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
