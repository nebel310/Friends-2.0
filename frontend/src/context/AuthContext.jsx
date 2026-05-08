import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { tokenManager } from '../services/tokenManager'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenManager.getUser())
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get('/auth/me')
      tokenManager.setUser(userData)
      setUser(userData)
      return userData
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          await tokenManager.refreshAccessToken()
          await refreshUser()
        } catch {
          tokenManager.clearTokens()
          setUser(null)
        }
      }
      setLoading(false)
    }
    init()
  }, [refreshUser])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password }, true)
    tokenManager.setTokens(response.access_token, response.refresh_token)
    await new Promise(r => setTimeout(r, 100))
    const userData = await api.get('/auth/me')
    tokenManager.setUser(userData)
    setUser(userData)
    return userData
  }

  const register = async (username, email, password, passwordConfirm) => {
    await api.post('/auth/register', {
      username,
      email,
      password,
      password_confirm: passwordConfirm,
      is_confirmed: false,
    }, true)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // игнорируем ошибку, всё равно чистим токены
    } finally {
      tokenManager.clearTokens()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
