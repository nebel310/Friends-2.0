import { tokenManager } from './tokenManager'

const BASE_URL = '/api'

async function parseErrorResponse(response) {
  try {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json()
      if (errorData.detail) return errorData.detail
      if (errorData.message) return errorData.message
      if (Array.isArray(errorData)) return errorData.map(e => e.msg || JSON.stringify(e)).join(', ')
      const messages = []
      for (const key in errorData) {
        if (Array.isArray(errorData[key])) messages.push(`${key}: ${errorData[key].join(', ')}`)
        else messages.push(`${key}: ${errorData[key]}`)
      }
      return messages.length > 0 ? messages.join('; ') : JSON.stringify(errorData)
    }
    const text = await response.text()
    return text || `HTTP error! status: ${response.status}`
  } catch {
    return `HTTP error! status: ${response.status}`
  }
}

async function request(endpoint, options = {}, skipAuth = false) {
  const url = `${BASE_URL}${endpoint}`
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }

  if (options.body && config.method !== 'GET') {
    config.body = JSON.stringify(options.body)
  }

  if (!skipAuth) {
    try {
      const accessToken = await tokenManager.getValidAccessToken()
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    } catch (error) {
      if (error.message.includes('Не удалось обновить токен') || error.message.includes('No refresh token available')) {
        tokenManager.clearTokens()
        window.location.href = '/login'
        return
      }
      throw error
    }
  }

  const response = await fetch(url, config)

  if (!skipAuth && response.status === 401) {
    tokenManager.clearTokens()
    window.location.href = '/login'
    return
  }

  if (!response.ok) {
    const errorData = await parseErrorResponse(response)
    throw new Error(errorData)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export const api = {
  get: (endpoint, skipAuth = false) => request(endpoint, { method: 'GET' }, skipAuth),
  post: (endpoint, data, skipAuth = false) => request(endpoint, { method: 'POST', body: data }, skipAuth),
  patch: (endpoint, data, skipAuth = false) => request(endpoint, { method: 'PATCH', body: data }, skipAuth),
  delete: (endpoint, skipAuth = false) => request(endpoint, { method: 'DELETE' }, skipAuth),

  async uploadFile(file, bucket = 'proofs') {
    const formData = new FormData()
    formData.append('file', file)
    const accessToken = await tokenManager.getValidAccessToken()
    const response = await fetch(`${BASE_URL}/files/upload?bucket=${bucket}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    })
    if (!response.ok) {
      const errorText = await parseErrorResponse(response)
      throw new Error(errorText)
    }
    return response.json()
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)
    const accessToken = await tokenManager.getValidAccessToken()
    const response = await fetch(`${BASE_URL}/profile/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    })
    if (!response.ok) {
      const errorText = await parseErrorResponse(response)
      throw new Error(errorText)
    }
    return response.json()
  },
}
