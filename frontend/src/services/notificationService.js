/**
 * Member 4: Notification Service
 * Handles all notification API calls
 */
import apiClient from '../api/apiClient'

const getAuthHeader = (token) => ({ Authorization: `Bearer ${token}` })

/**
 * Get all notifications for the current user
 * GET /api/notifications
 */
export const getNotifications = async (token, { page = 0, size = 20, unreadOnly = false } = {}) => {
  const params = { page, size }
  if (unreadOnly) params.unreadOnly = true

  const res = await apiClient.get('/api/notifications', {
    headers: getAuthHeader(token),
    params,
  })
  return res.data
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (token) => {
  const res = await apiClient.get('/api/notifications/unread-count', {
    headers: getAuthHeader(token),
  })
  return res.data.unreadCount
}

/**
 * Mark a notification as read
 * PUT /api/notifications/{id}/read
 */
export const markAsRead = async (token, notificationId) => {
  await apiClient.put(`/api/notifications/${notificationId}/read`, {}, {
    headers: getAuthHeader(token),
  })
}

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (token) => {
  await apiClient.put('/api/notifications/read-all', {}, {
    headers: getAuthHeader(token),
  })
}

/**
 * Delete a notification
 * DELETE /api/notifications/{id}
 */
export const deleteNotification = async (token, notificationId) => {
  await apiClient.delete(`/api/notifications/${notificationId}`, {
    headers: getAuthHeader(token),
  })
}

/**
 * Send system notification to a user (Admin only)
 * POST /api/notifications/admin/system
 */
export const sendSystemNotification = async (token, { userId, title, message }) => {
  const res = await apiClient.post('/api/notifications/admin/system', {
    userId,
    title,
    message,
  }, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Broadcast notification to all users (Admin only)
 * POST /api/notifications/admin/broadcast
 */
export const broadcastNotification = async (
  token,
  { title, message, type = 'INFO', category = 'SYSTEM', targetRoles = [] }
) => {
  const res = await apiClient.post('/api/notifications/admin/broadcast', {
    title,
    message,
    type,
    category,
    targetRoles,
  }, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Create role-based announcement (Admin only)
 * POST /api/notifications/admin/announcements
 */
export const createAnnouncement = async (token, { title, message, targetRoles = [] }) => {
  const res = await apiClient.post('/api/notifications/admin/announcements', {
    title,
    message,
    targetRoles,
  }, {
    headers: getAuthHeader(token),
  })
  return res.data
}
