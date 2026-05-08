import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', passwordConfirm: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { showNotification } = useNotification()
  const navigate = useNavigate()

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) {
      showNotification('Пароли не совпадают', 'error')
      return
    }
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.passwordConfirm)
      showNotification('Регистрация успешна! Подтвердите email.', 'success')
      setTimeout(() => navigate('/login'), 4000)
    } catch (error) {
      showNotification('Ошибка регистрации: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-form">
        <h2>Регистрация</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Имя пользователя:</label>
            <input type="text" id="username" name="username" required value={form.username} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input type="password" id="password" name="password" required value={form.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="passwordConfirm">Подтверждение пароля:</label>
            <input type="password" id="passwordConfirm" name="passwordConfirm" required value={form.passwordConfirm} onChange={handleChange} />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      </div>
    </>
  )
}
