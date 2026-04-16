import apiClient from '../api/apiClient'

// Legacy token-based methods (kept for backwards compatibility)
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

// NEW: Code-based verification methods
export async function sendVerificationCode(email, name) {
  const res = await apiClient.post('/api/auth/send-verification-code', { email, name })
  return res.data
}

export async function registerWithCode(email, name, password, verificationCode, role) {
  const res = await apiClient.post('/api/auth/register-with-code', {
    email,
    name,
    password,
    verificationCode,
    role
  })
  return res.data
}

export async function sendPasswordResetCode(email) {
  const res = await apiClient.post('/api/auth/send-reset-code', { email })
  return res.data
}

export async function resetPasswordWithCode(email, resetCode, newPassword) {
  const res = await apiClient.post('/api/auth/reset-password-with-code', {
    email,
    resetCode,
    newPassword
  })
  return res.data
}

export async function verifyResetCode(email, code) {
  const res = await apiClient.post('/api/auth/verify-reset-code', { email, code })
  return res.data
}

// Note: Email code verification is done automatically during registration
// via registerWithCode. The backend handles code verification in that endpoint.
