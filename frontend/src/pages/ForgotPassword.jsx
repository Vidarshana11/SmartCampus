import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEnvelope, FaGraduationCap, FaKey, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa'
import { sendPasswordResetCode, resetPasswordWithCode, verifyResetCode } from '../services/authService'
import { usePageTitle } from '../hooks/usePageTitle'

export default function ForgotPassword() {
  usePageTitle('Forgot Password')
  const navigate = useNavigate()

  // Form fields
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const passwordChecks = useMemo(() => {
    const hasMinLength = newPassword.length >= 6
    const hasCapitalLetter = /[A-Z]/.test(newPassword)
    const hasNumber = /\d/.test(newPassword)
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword)

    return [
      { key: 'length', label: 'At least 6 characters', passed: hasMinLength },
      { key: 'capital', label: 'One capital letter', passed: hasCapitalLetter },
      { key: 'number', label: 'One numeric character', passed: hasNumber },
      { key: 'symbol', label: 'One symbol', passed: hasSymbol },
    ]
  }, [newPassword])

  const isPasswordStrong = passwordChecks.every((check) => check.passed)

  // UI state
  const [step, setStep] = useState(1) // 1 = email, 2 = verify code, 3 = change password
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Step 1: Send reset code
  const handleSendCode = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const data = await sendPasswordResetCode(email)
      setMessage(data?.message ?? 'If this email exists, a password reset code has been sent.')
      setStep(2)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Unable to process request right now.')
    } finally {
      setSubmitting(false)
    }
  }

  // Step 2: Verify the reset code
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (resetCode.length !== 6) {
      setError('Please enter the 6-digit reset code.')
      return
    }

    setSubmitting(true)
    try {
      await verifyResetCode(email, resetCode)
      setMessage('Code verified successfully. You can now set a new password.')
      setStep(3)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Invalid or expired reset code.')
    } finally {
      setSubmitting(false)
    }
  }

  // Step 3: Reset password with verified code
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordStrong) {
      setError('Password must be at least 6 characters and include a capital letter, a number, and a symbol.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const data = await resetPasswordWithCode(email, resetCode, newPassword)
      setMessage(data?.message ?? 'Password reset successful. You can now sign in.')
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Password reset successful. Please sign in with your new password.' }
        })
      }, 2000)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to reset password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Resend code
  const handleResendCode = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const data = await sendPasswordResetCode(email)
      setMessage(data?.message ?? 'A new reset code has been sent.')
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Unable to resend code.')
    } finally {
      setSubmitting(false)
    }
  }

  // Go back to previous step
  const handleBack = () => {
    if (step === 3) {
      setStep(2)
      setNewPassword('')
      setConfirmPassword('')
    } else if (step === 2) {
      setStep(1)
      setResetCode('')
    }
    setError(null)
    setMessage(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#003366] rounded-xl flex items-center justify-center mx-auto mb-4">
            <FaGraduationCap className="w-8 h-8 text-[#c9a227]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify Code' : 'Change Password'}
          </h1>
          <p className="text-gray-600 mt-1">
            {step === 1
              ? 'Enter your email to receive a reset code.'
              : step === 2
              ? `Enter the 6-digit code sent to ${email}`
              : 'Set a new password for your account.'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 1 ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-500'
          }`}>1</div>
          <div className={`w-10 h-1 ${step >= 2 ? 'bg-[#003366]' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 2 ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-500'
          }`}>2</div>
          <div className={`w-10 h-1 ${step >= 3 ? 'bg-[#003366]' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 3 ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-500'
          }`}>3</div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          // Step 1: Email Form
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaEnvelope className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent text-black"
                  placeholder="student@campus.edu"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-[#003366] hover:bg-[#004080] text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : step === 2 ? (
          // Step 2: Verify Code Form
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                Reset Code
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaKey className="w-4 h-4" />
                </div>
                <input
                  id="resetCode"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent text-black text-center text-xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || resetCode.length !== 6}
              className="w-full py-3 px-4 bg-[#003366] hover:bg-[#004080] text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={submitting}
                  className="text-[#003366] hover:underline font-medium disabled:opacity-60"
                >
                  Resend code
                </button>
              </p>
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Use a different email
              </button>
            </div>
          </form>
        ) : (
          // Step 3: Change Password Form (after code verified)
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <FaCheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm font-medium">Code verified successfully</span>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaLock className="w-4 h-4" />
                </div>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent text-black"
                  placeholder="At least 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700">Password must include:</p>
              <div className="space-y-2">
                {passwordChecks.map((check) => (
                  <div key={check.key} className="flex items-center gap-2 text-xs">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${check.passed ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {check.passed ? '✓' : '•'}
                    </span>
                    <span className={check.passed ? 'text-emerald-700' : 'text-gray-600'}>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent text-black"
                placeholder="Re-enter new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isPasswordStrong}
              className="w-full py-3 px-4 bg-[#003366] hover:bg-[#004080] text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Change Password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to code verification
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-[#003366] hover:underline font-medium">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
