/**
 * Member 4: Notification Service
 * Handles all notification API calls
 */
import apiClient from '../api/apiClient'

const getAuthHeader = (token) => ({ Authorization: `Bearer ${token}` })

export const ANNOUNCEMENT_URGENCY = {
  NORMAL: 'NORMAL',
  IMPORTANT: 'IMPORTANT',
  URGENT: 'URGENT',
}

const URGENCY_TO_TYPE = {
  [ANNOUNCEMENT_URGENCY.NORMAL]: 'INFO',
  [ANNOUNCEMENT_URGENCY.IMPORTANT]: 'WARNING',
  [ANNOUNCEMENT_URGENCY.URGENT]: 'ERROR',
}

export const mapUrgencyToNotificationType = (urgency) => URGENCY_TO_TYPE[urgency] || 'INFO'

export const getAnnouncementUrgencyMeta = (type) => {
  switch (type) {
    case 'ERROR':
      return {
        label: 'Urgent',
        chipClass: 'bg-red-100 text-red-700',
        borderClass: 'border-red-500',
      }
    case 'WARNING':
      return {
        label: 'Important',
        chipClass: 'bg-amber-100 text-amber-700',
        borderClass: 'border-amber-500',
      }
    case 'SUCCESS':
      return {
        label: 'Positive',
        chipClass: 'bg-emerald-100 text-emerald-700',
        borderClass: 'border-emerald-500',
      }
    case 'INFO':
    default:
      return {
        label: 'Normal',
        chipClass: 'bg-blue-100 text-blue-700',
        borderClass: 'border-blue-500',
      }
  }
}

export const isAnnouncementNotification = (notification) => {
  if (!notification) return false
  return Boolean(notification.campaignId)
}

export const isRegularNotification = (notification) => {
  if (!notification) return false
  return !isAnnouncementNotification(notification)
}

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
 * Get all announcement notifications for the current user.
 * Announcements are campaign-based notifications created by admin.
 */
export const getAllAnnouncements = async (token, { pageSize = 100, limit } = {}) => {
  const announcements = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const data = await getNotifications(token, { page, size: pageSize })
    const pageNotifications = Array.isArray(data?.notifications) ? data.notifications : []

    announcements.push(...pageNotifications.filter(isAnnouncementNotification))
    if (typeof limit === 'number' && limit > 0 && announcements.length >= limit) {
      break
    }

    const parsedTotalPages = Number(data?.totalPages)
    if (Number.isFinite(parsedTotalPages)) {
      totalPages = Math.max(parsedTotalPages, 1)
    } else {
      totalPages = page + 1
    }

    page += 1
  }

  const sortedAnnouncements = announcements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (typeof limit === 'number' && limit > 0) {
    return sortedAnnouncements.slice(0, limit)
  }

  return sortedAnnouncements
}

/**
 * Get announcements for dashboard cards.
 * Announcements are campaign-based notifications created by admin.
 */
export const getDashboardAnnouncements = async (token, { limit = 6 } = {}) => {
  return getAllAnnouncements(token, { limit })
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
export const createAnnouncement = async (token, {
  title,
  message,
  urgency = ANNOUNCEMENT_URGENCY.NORMAL,
  targetRoles = [],
}) => {
  const urgencyType = mapUrgencyToNotificationType(urgency)
  const res = await apiClient.post('/api/notifications/admin/announcements', {
    title,
    message,
    urgency,
    type: urgencyType,
    targetRoles,
  }, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Get admin announcement history grouped by campaign (Admin only)
 * GET /api/notifications/admin/history
 */
export const getAdminNotificationHistory = async (token) => {
  const res = await apiClient.get('/api/notifications/admin/history', {
    headers: getAuthHeader(token),
  })
  return res.data.notifications || []
}

/**
 * Update an admin notification campaign and propagate to recipients (Admin only)
 * PUT /api/notifications/admin/history/{campaignId}
 */
export const updateAdminNotificationHistory = async (
  token,
  campaignId,
  { title, message, enabled }
) => {
  const payload = {}
  if (typeof title === 'string') payload.title = title
  if (typeof message === 'string') payload.message = message
  if (typeof enabled === 'boolean') payload.enabled = enabled

  const encodedCampaignId = encodeURIComponent(campaignId)
  const res = await apiClient.put(`/api/notifications/admin/history/${encodedCampaignId}`, payload, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Delete an admin notification campaign from history and recipients (Admin only)
 * DELETE /api/notifications/admin/history/{campaignId}
 */
export const deleteAdminNotificationHistory = async (token, campaignId) => {
  const encodedCampaignId = encodeURIComponent(campaignId)
  const res = await apiClient.delete(`/api/notifications/admin/history/${encodedCampaignId}`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

// ===== ADMIN-SPECIFIC NOTIFICATIONS (Separate from user notifications) =====

/**
 * Get admin-specific notifications (ADMIN_ALERT category)
 * These are notifications specifically for admins about new tickets, etc.
 * GET /api/notifications/admin
 */
export const getAdminNotifications = async (token, { page = 0, size = 20 } = {}) => {
  const res = await apiClient.get('/api/notifications/admin', {
    headers: getAuthHeader(token),
    params: { page, size },
  })
  return res.data
}

/**
 * Get unread admin notification count
 * GET /api/notifications/admin/unread-count
 */
export const getAdminUnreadCount = async (token) => {
  const res = await apiClient.get('/api/notifications/admin/unread-count', {
    headers: getAuthHeader(token),
  })
  return res.data.unreadCount
}

/**
 * Mark admin notification as read
 * Uses the same endpoint as regular notifications
 */
export const markAdminNotificationAsRead = async (token, notificationId) => {
  await apiClient.put(`/api/notifications/${notificationId}/read`, {}, {
    headers: getAuthHeader(token),
  })
}

/**
 * Mark all admin notifications as read
 * Uses the same endpoint as regular notifications
 */
export const markAllAdminNotificationsAsRead = async (token) => {
  await apiClient.put('/api/notifications/read-all', {}, {
    headers: getAuthHeader(token),
  })
}
