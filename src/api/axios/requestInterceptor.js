/**
 * Request Interceptor
 *
 * Runs before every request made through sellerAxiosInstance.
 * Responsibilities:
 *   1. Inject Bearer token from sessionStorage automatically
 *   2. Log outgoing requests in development for debugging
 */

export function attachRequestInterceptors(instance) {
  instance.interceptors.request.use(
    (config) => {
      // Inject auth token
      const token = sessionStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Dev logging
      if (import.meta.env.DEV) {
        console.debug(`[Seller API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '')
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}
