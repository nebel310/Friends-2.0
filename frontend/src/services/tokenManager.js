class TokenManager {
  constructor() {
    this.refreshToken = localStorage.getItem('refreshToken')
    this.accessToken = null
    try {
      const userData = localStorage.getItem('user')
      this.user = userData ? JSON.parse(userData) : null
    } catch {
      this.user = null
    }
  }

  getAccessToken() { return this.accessToken }
  getRefreshToken() { return this.refreshToken }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken
    if (refreshToken) {
      this.refreshToken = refreshToken
      localStorage.setItem('refreshToken', refreshToken)
    }
  }

  setUser(user) {
    this.user = user
    localStorage.setItem('user', JSON.stringify(user))
  }

  getUser() { return this.user }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.user = null
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  isAuthenticated() { return !!this.refreshToken }

  async refreshAccessToken() {
    if (!this.refreshToken) throw new Error('No refresh token available')

    const response = await fetch(`/api/auth/refresh?refresh_token=${encodeURIComponent(this.refreshToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      this.clearTokens()
      throw new Error(errorData.detail || 'Failed to refresh token')
    }

    const data = await response.json()
    this.accessToken = data.access_token
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token
      localStorage.setItem('refreshToken', data.refresh_token)
    }
    return this.accessToken
  }

  isAccessTokenExpired() {
    if (!this.accessToken) return true
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  async getValidAccessToken() {
    if (!this.accessToken || this.isAccessTokenExpired()) {
      await this.refreshAccessToken()
    }
    return this.accessToken
  }
}

export const tokenManager = new TokenManager()
