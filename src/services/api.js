const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export async function apiRequest(path, options = {}) {
  const accessToken = sessionStorage.getItem('accessToken')

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    // No JSON response
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }

  return data
}