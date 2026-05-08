import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { useNotification } from '../context/NotificationContext'
import { api } from '../services/api'

export default function CreateChallenge() {
  const [friends, setFriends] = useState([])
  const [form, setForm] = useState({ friendship: '', title: '', description: '' })
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/friends/?limit=100&offset=0').then(data => setFriends(data || [])).catch(() => {})
  }, [])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.friendship) { showNotification('Выберите друга', 'error'); return }
    setLoading(true)
    try {
      await api.post('/challenges', {
        friendship_id: parseInt(form.friendship),
        title: form.title,
        description: form.description || null,
      })
      showNotification('Челлендж успешно создан!', 'success')
      navigate('/challenges')
    } catch (error) {
      showNotification('Ошибка создания: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="page">
        <div className="section">
          <h2>Создать челлендж</h2>
          <form onSubmit={handleSubmit} className="create-challenge-form">
            <div className="form-group">
              <label>Выберите друга:</label>
              <select name="friendship" required value={form.friendship} onChange={handleChange}>
                <option value="">-- Выберите друга --</option>
                {friends.map(f => (
                  <option key={f.friendship_id} value={f.friendship_id}>{f.username}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Название:</label>
              <input type="text" name="title" required maxLength={100} placeholder="Введите название" value={form.title} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Описание (необязательно):</label>
              <textarea name="description" rows={4} placeholder="Опишите задание" value={form.description} onChange={handleChange} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn" disabled={loading}>{loading ? 'Создание...' : 'Создать челлендж'}</button>
              <Link to="/challenges" className="btn btn-secondary">Отмена</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
