/**
 * Member 4: Role Management Service
 * Handles user role management and user listing
 */
import apiClient from '../api/apiClient'

const getAuthHeader = (token) => ({ Authorization: `Bearer ${token}` })

/**
 * Get all available roles
 * GET /api/roles
 */
export const getRoles = async (token) => {
  const res = await apiClient.get('/api/roles', {
    headers: getAuthHeader(token),
  })
  return res.data.roles
}

/**
 * Get all users with pagination and filtering
 * GET /api/users
 */
export const getUsers = async (token, { page = 0, size = 20, search = '', role = null } = {}) => {
  const params = { page, size }
  if (search) params.search = search
  if (role) params.role = role

  const res = await apiClient.get('/api/users', {
    headers: getAuthHeader(token),
    params,
  })
  return res.data
}

/**
 * Get user by ID
 * GET /api/users/{id}
 */
export const getUserById = async (token, userId) => {
  const res = await apiClient.get(`/api/users/${userId}`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Get current user details
 * GET /api/users/me
 */
export const getCurrentUser = async (token) => {
  const res = await apiClient.get('/api/users/me', {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Get users by role
 * GET /api/users/role/{role}
 */
export const getUsersByRole = async (token, role, { page = 0, size = 20 } = {}) => {
  const res = await apiClient.get(`/api/users/role/${role}`, {
    headers: getAuthHeader(token),
    params: { page, size },
  })
  return res.data
}

/**
 * Update user role (Admin only)
 * PUT /api/users/{id}/role
 */
export const updateUserRole = async (token, userId, role) => {
  const res = await apiClient.put(`/api/users/${userId}/role`, { role }, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Update user details
 * PUT /api/users/{id}
 */
export const updateUser = async (token, userId, { name }) => {
  const res = await apiClient.put(`/api/users/${userId}`, { name }, {
    headers: getAuthHeader(token),
  })
  return res.data
}

/**
 * Delete user (Admin only)
 * DELETE /api/users/{id}
 */
export const deleteUser = async (token, userId) => {
  await apiClient.delete(`/api/users/${userId}`, {
    headers: getAuthHeader(token),
  })
}
