import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
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
  (error) => {
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
