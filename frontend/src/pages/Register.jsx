import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { BRAND_FULL_NAME } from '../constants/branding'
import { sendVerificationCode, registerWithCode } from '../services/authService'
import { FaGraduationCap, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaIdBadge, FaKey } from 'react-icons/fa'

const ALLOWED_SELF_REGISTRATION_ROLES = ['STUDENT', 'LECTURER']

export default function Register() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Create Account')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('STUDENT')
  const [verificationCode, setVerificationCode] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // UI state
  const [step, setStep] = useState(1) // 1 = details, 2 = verification code
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Step 1: Send verification code
  const handleRequestCode = async (e) => {
    e.preventDefault()
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setError(null)
    setMessage(null)
    setSubmitting(true)

    try {
      const result = await sendVerificationCode(email, name)
      setMessage(result?.message ?? 'Verification code sent to your email.')
      setStep(2)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to send verification code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Step 2: Verify code and register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }
    if (!ALLOWED_SELF_REGISTRATION_ROLES.includes(role)) {
      setError('Only Student and Lecturer accounts can be created from this page')
      return
    }

    setError(null)
    setMessage(null)
    setSubmitting(true)

    try {
      const result = await registerWithCode(email, name, password, verificationCode, role)

      // Auto-login after successful registration
      if (result?.token) {
        loginWithToken(result.token)
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/login', {
          replace: true,
          state: { message: result?.message ?? 'Registration successful. Please sign in.' },
        })
      }
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Invalid verification code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Resend code
  const handleResendCode = async () => {
    setError(null)
    setMessage(null)
    setSubmitting(true)

    try {
      const result = await sendVerificationCode(email, name)
      setMessage(result?.message ?? 'New verification code sent to your email.')
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to resend code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Go back to step 1
  const handleBack = () => {
    setStep(1)
    setError(null)
    setMessage(null)
    setVerificationCode('')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#003366] via-[#004080] to-[#005299] relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <div className="w-28 h-28 bg-white rounded-2xl p-2 flex items-center justify-center mb-6 shadow-2xl ring-4 ring-white/30">
            <img src="/universityImage.png" alt="University logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">Join {BRAND_FULL_NAME}</h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            Create your student or lecturer account and get access to all campus resources and services.
          </p>
          <div className="mt-12 space-y-4 text-left max-w-sm">
            {[
              'Access your courses and grades',
              'Book campus facilities',
              'Get instant notifications',
              'Connect with campus community',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md my-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-[#003366]/20">
              <img src="/universityImage.png" alt="University logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{BRAND_FULL_NAME}</h1>
            <p className="text-gray-600">Create your student or lecturer account</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 1 ? 'Create Account' : 'Verify Email'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {step === 1
                    ? 'Fill in your details to get started'
                    : `Enter the 6-digit code sent to ${email}`}
                </p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 1 ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-500'
                }`}>1</div>
                <div className={`w-12 h-1 ${step >= 2 ? 'bg-[#003366]' : 'bg-gray-200'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 2 ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-500'
                }`}>2</div>
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
                // Step 1: Account Details Form
                <form onSubmit={handleRequestCode} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaUser className="w-5 h-5" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-black placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaEnvelope className="w-5 h-5" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@campus.edu"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-black placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaLock className="w-5 h-5" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-black placeholder:text-gray-400"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">Must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="role">
                      Account Type
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaIdBadge className="w-5 h-5" />
                      </div>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => {
                          const selectedRole = e.target.value
                          setRole(ALLOWED_SELF_REGISTRATION_ROLES.includes(selectedRole) ? selectedRole : 'STUDENT')
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all bg-white text-black appearance-none cursor-pointer"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="LECTURER">Lecturer</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link to="#" className="text-[#003366] hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="#" className="text-[#003366] hover:underline">Privacy Policy</Link>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-[#003366] hover:bg-[#004080] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending code...
                      </span>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Verification Code Form
                <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="verificationCode">
                      Verification Code
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaKey className="w-5 h-5" />
                      </div>
                      <input
                        id="verificationCode"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-black text-center text-2xl tracking-widest placeholder:text-gray-300"
                        required
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || verificationCode.length !== 6}
                    className="w-full py-3 px-4 bg-[#003366] hover:bg-[#004080] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Create Account'
                    )}
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
                      ← Go back
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-[#003366] hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-[#003366] transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
