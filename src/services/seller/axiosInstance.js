import axios from 'axios'

const sellerAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor ─────────────────────────────────────
// Attach Bearer token to every request automatically
sellerAxios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ────────────────────────────────────
// Unwrap successful responses: return res.data directly
// Normalize errors: extract message, attach status code
// Auto-logout on 401
sellerAxios.interceptors.response.use(
  (response) => response.data,   // unwrap → caller gets { success, data, ... } directly
  (error) => {
    const status  = error.response?.status
    const message = error.response?.data?.message || error.message || 'Something went wrong'

    if (status === 401) {
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(new Error('Session expired. Redirecting to login…'))
    }

    if (status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'))
    }

    const err    = new Error(message)
    err.status   = status
    err.data     = error.response?.data
    return Promise.reject(err)
  }
)

export default sellerAxios
