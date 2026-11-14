// Path from src/api/service/ to your fetch-based api.js (exports apiRequest).
// If your api.js is somewhere else, only change this line.
import { apiRequest } from '../../services/api'

const NotificationService = {
  list: ({ page = 1, limit = 10, unreadOnly = false } = {}) => {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      unreadOnly: String(unreadOnly),
    })
    return apiRequest(`/notifications?${qs.toString()}`)
  },

  getUnreadCount: () => apiRequest('/notifications/unread-count'),

  markAsRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllAsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),
}

export default NotificationService