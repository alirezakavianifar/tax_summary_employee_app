import axios from 'axios'
import { API_URL } from './config';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
  timeout: 60000, // 60 second timeout - allow time for database queries
})

import { tokenManager } from './tokenManager'

// Request interceptor for attaching token and logging
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken() || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Skip if the request is for auth lifecycle endpoints to avoid loops
    if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/refresh') || originalRequest.url?.includes('/logout')) {
      return Promise.reject(error)
    }

    // If error is 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Import dynamically to avoid circular dependency
        const { refreshToken } = await import('./auth')
        const refreshData = await refreshToken()

        const token = tokenManager.getAccessToken() || refreshData.accessToken
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear in-memory token and redirect to login
        tokenManager.clearAccessToken()
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data)
      const errorMessage = error.response.data?.error || 'خطا در ارتباط با سرور'
      return Promise.reject(new Error(errorMessage))
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request)
      return Promise.reject(new Error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید'))
    } else {
      // Something else happened
      console.error('Error:', error.message)
      return Promise.reject(error)
    }
  }
)
