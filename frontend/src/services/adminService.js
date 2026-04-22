/**
 * Admin Panel Service
 * Handles all admin-specific API calls for user, resource, booking, and notification management
 */

import apiClient from '../api/apiClient'

const getAuthHeader = (token) => ({ Authorization: `Bearer ${token}` })

// ===== USER MANAGEMENT =====

/**
 * Get all users with pagination, search, and role filtering
 * GET /api/users
 */
export const getAdminUsers = async (token, { page = 0, size = 10, search = '', role = null } = {}) => {
  const params = { page, size }
  if (search) params.search = search
  if (role) params.role = role

  const res = await apiClient.get('/api/users', {
    headers: getAuthHeader(token),
    params,
  })

  // Transform backend response to match expected format
  return {
    content: res.data.users || [],
    totalElements: res.data.totalItems || 0,
    totalPages: res.data.totalPages || 0,
    currentPage: res.data.currentPage || 0,
  }
}

/**
 * Get user by ID
 * GET /api/users/{id}
 */
export const getAdminUserById = async (token, userId) => {
  const res = await apiClient.get(`/api/users/${userId}`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Update user details (name, email)
 * PUT /api/users/{id}
 */
export const editAdminUser = async (token, userId, { name, email }) => {
  const res = await apiClient.put(
    `/api/users/${userId}`,
    { name, email },
    { headers: getAuthHeader(token) }
  )
  return res.data
}

/**
 * Change user role
 * PUT /api/users/{id}/role
 */
export const changeAdminUserRole = async (token, userId, role) => {
  const res = await apiClient.put(
    `/api/users/${userId}/role`,
    { role },
    { headers: getAuthHeader(token) }
  )
  return res.data
}

/**
 * Delete user
 * DELETE /api/users/{id}
 */
export const deleteAdminUser = async (token, userId) => {
  const res = await apiClient.delete(`/api/users/${userId}`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Create new user (Admin only)
 * POST /api/auth/admin/register
 * Regular users need email verification, ADMIN accounts are auto-verified
 */
export const createAdminUser = async (token, { name, email, password, role = 'STUDENT' }) => {
  const res = await apiClient.post(
    '/api/auth/admin/register',
    { name, email, password, role },
    { headers: getAuthHeader(token) }
  )
  return res.data
}

/**
 * Create new admin user (Admin only)
 * POST /api/auth/admin/register (with ADMIN role)
 * Admin accounts are automatically email-verified
 */
export const createAdminAccount = async (token, { name, email, password }) => {
  const res = await apiClient.post(
    '/api/auth/admin/register',
    { name, email, password, role: 'ADMIN' },
    { headers: getAuthHeader(token) }
  )
  return res.data
}

// ===== RESOURCE MANAGEMENT =====

/**
 * Get all resources with pagination and filtering
 * GET /api/resources
 */
export const getAdminResources = async (token, { page = 0, size = 10, type = null, status = null, search = '' } = {}) => {
  const params = { page, size }
  if (type) params.type = type
  if (status) params.status = status
  if (search) params.search = search

  const res = await apiClient.get('/api/resources', {
    headers: getAuthHeader(token),
    params,
  })
  return res.data
}

/**
 * Get resource by ID
 * GET /api/resources/{id}
 */
export const getAdminResourceById = async (token, resourceId) => {
  const res = await apiClient.get(`/api/resources/${resourceId}`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Create resource
 * POST /api/resources
 */
export const createAdminResource = async (token, resource) => {
  const res = await apiClient.post('/api/resources', resource, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Update resource
 * PUT /api/resources/{id}
 */
export const updateAdminResource = async (token, resourceId, resource) => {
  const res = await apiClient.put(`/api/resources/${resourceId}`, resource, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Delete resource
 * DELETE /api/resources/{id}
 */
export const deleteAdminResource = async (token, resourceId) => {
  const res = await apiClient.delete(`/api/resources/${resourceId}`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

// ===== BOOKING MANAGEMENT =====

/**
 * Get all bookings with pagination and status filtering
 * GET /api/bookings
 */
export const getAdminBookings = async (token, { page = 0, size = 10, status = null } = {}) => {
  const params = { page, size }
  if (status) params.status = status

  const res = await apiClient.get('/api/bookings', {
    headers: getAuthHeader(token),
    params,
  })
  return res.data
}

/**
 * Get pending bookings
 * GET /api/bookings/pending
 */
export const getPendingBookings = async (token, { page = 0, size = 10 } = {}) => {
  const res = await apiClient.get('/api/bookings/pending', {
    headers: getAuthHeader(token),
    params: { page, size },
  })
  return res.data
}

/**
 * Get booking by ID
 * GET /api/bookings/{id}
 */
export const getAdminBookingById = async (token, bookingId) => {
  const res = await apiClient.get(`/api/bookings/${bookingId}`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Approve booking
 * PUT /api/bookings/{id}/approve
 */
export const approveAdminBooking = async (token, bookingId) => {
  const res = await apiClient.put(
    `/api/bookings/${bookingId}/approve`,
    {},
    { headers: getAuthHeader(token) }
  )
  return res.data
}

/**
 * Reject booking with reason
 * PUT /api/bookings/{id}/reject
 */
export const rejectAdminBooking = async (token, bookingId, reason) => {
  const res = await apiClient.put(
    `/api/bookings/${bookingId}/reject`,
    { rejectionReason: reason },
    { headers: getAuthHeader(token) }
  )
  return res.data
}

/**
 * Cancel booking (admin action)
 * PUT /api/bookings/{id}/cancel
 */
export const cancelAdminBooking = async (token, bookingId) => {
  const res = await apiClient.put(
    `/api/bookings/${bookingId}/cancel`,
    {},
    { headers: getAuthHeader(token) }
  )
  return res.data
}

// ===== NOTIFICATIONS & ANNOUNCEMENTS =====

/**
 * Send system notification to specific users
 * POST /api/notifications/admin/system
 */
export const sendSystemNotification = async (token, { title, message, userIds, type = 'INFO', category = 'SYSTEM' }) => {
  const res = await apiClient.post(
    '/api/notifications/admin/system',
    { title, message, userIds, type, category },
    { headers: getAuthHeader(token) }
  )
  return res.data
}

/**
 * Broadcast notification to all users
 * POST /api/notifications/admin/broadcast
 */
export const broadcastNotification = async (token, { title, message, type = 'INFO', category = 'SYSTEM' }) => {
  const res = await apiClient.post(
    '/api/notifications/admin/broadcast',
    { title, message, type, category },
    { headers: getAuthHeader(token) }
  )
  return res.data
}

/**
 * Get all notifications (for tracking purposes)
 * GET /api/notifications
 */
export const getNotifications = async (token, { page = 0, size = 10, unreadOnly = false } = {}) => {
  const params = { page, size }
  if (unreadOnly) params.unreadOnly = true

  const res = await apiClient.get('/api/notifications', {
    headers: getAuthHeader(token),
    params,
  })
  return res.data
}

// ===== ANALYTICS & STATISTICS =====

/**
 * Get admin dashboard statistics
 * Aggregates data from various endpoints
 */
export const getAdminStats = async (token) => {
  try {
    // Fetch data in parallel
    const [usersRes, resourcesRes, bookingsRes] = await Promise.all([
      getAdminUsers(token, { page: 0, size: 1 }), // Get total count
      getAdminResources(token, { page: 0, size: 1 }),
      apiClient.get('/api/bookings/analytics', {
        headers: getAuthHeader(token),
      }),
    ])

    return {
      totalUsers: usersRes.totalElements || 0,
      totalResources: resourcesRes.totalElements || 0,
      totalBookings: bookingsRes.data?.totalBookings || 0,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    throw error
  }
}

/**
 * Get user statistics by role
 * Aggregates user data by role
 */
export const getUserStatsbyRole = async (token) => {
  try {
    const roles = ['STUDENT', 'LECTURER', 'TECHNICIAN', 'MANAGER', 'ADMIN']
    const stats = {}

    const results = await Promise.all(
      roles.map((role) =>
        getAdminUsers(token, { page: 0, size: 1, role }).catch(() => ({ totalElements: 0 }))
      )
    )

    roles.forEach((role, index) => {
      stats[role] = results[index].totalElements || 0
    })

    return stats
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    throw error
  }
}

/**
 * Get booking statistics
 * Aggregates booking data by status
 */
export const getBookingStats = async (token) => {
  try {
    const res = await apiClient.get('/api/bookings/analytics', {
      headers: getAuthHeader(token),
    })

    return {
      PENDING: res.data?.pendingBookings || 0,
      APPROVED: res.data?.approvedBookings || 0,
      REJECTED: res.data?.rejectedBookings || 0,
      CANCELLED: res.data?.cancelledBookings || 0,
    }
  } catch (error) {
    console.error('Failed to fetch booking stats:', error)
    throw error
  }
}
