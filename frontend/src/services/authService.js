import apiClient from '../api/apiClient'

export async function requestPasswordReset(email) {
  const res = await apiClient.post('/api/auth/forgot-password', { email })
  return res.data
}

export async function resetPassword(token, newPassword) {
  const res = await apiClient.post('/api/auth/reset-password', { token, newPassword })
  return res.data
}

export async function verifyEmail(token) {
  const res = await apiClient.post('/api/auth/verify-email', { token })
  return res.data
}

export async function resendVerificationEmail(email) {
  const res = await apiClient.post('/api/auth/resend-verification', { email })
  return res.data
}
