/**
 * Response Interceptor
 *
 * Runs after every response received through sellerAxiosInstance.
 * Responsibilities:
 *   1. Unwrap the { success, data } envelope → return data directly to callers
 *   2. Normalize all error responses into plain JS Error objects with .status
 *   3. Handle 401 (expired/invalid token) → auto-logout and redirect to /login
 *   4. Handle 403 (insufficient permissions) → clear message
 *   5. Log errors in development
 */

export function attachResponseInterceptors(instance) {

  // ── Success ─────────────────────────────────────────────────────
  // The backend wraps all responses as { success: true, data: ... }
  // Unwrap here so every service function receives { data, pagination, ... } directly
  instance.interceptors.response.use(
    (response) => {
      return response.data   // e.g. { success: true, data: { ... } }
    },

    // ── Error ──────────────────────────────────────────────────────
    (error) => {
      const status  = error.response?.status
      const message = error.response?.data?.message
                   || error.message
                   || 'An unexpected error occurred'

      // Dev logging
      if (import.meta.env.DEV) {
        console.error(`[Seller API Error] ${status} — ${message}`, error.response?.data)
      }

      // 401 — session expired or token invalid → force logout
      if (status === 401) {
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(new Error('Session expired. Please log in again.'))
      }

      // 403 — seller doesn't have permission
      if (status === 403) {
        return Promise.reject(new Error('You do not have permission to perform this action.'))
      }

      // 409 — conflict (e.g. duplicate SKU, stock constraint)
      if (status === 409) {
        return Promise.reject(new Error(message))
      }

      // 400 — validation error from backend Zod schema
      if (status === 400) {
        return Promise.reject(new Error(message))
      }

      // 404 — resource not found
      if (status === 404) {
        const err    = new Error(message)
        err.status   = 404
        return Promise.reject(err)
      }

      // All other errors
      const err    = new Error(message)
      err.status   = status
      err.response = error.response
      return Promise.reject(err)
    }
  )
}
