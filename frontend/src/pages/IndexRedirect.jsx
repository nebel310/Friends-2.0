import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function IndexRedirect() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (user) navigate('/friends', { replace: true })
    else navigate('/landing', { replace: true })
  }, [user, loading, navigate])

  return <div className="loading">Загрузка...</div>
}
