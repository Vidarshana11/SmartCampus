import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { FaGraduationCap, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaIdBadge } from 'react-icons/fa'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Create Account')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('STUDENT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const result = await register({ email, name, password, role })
      navigate('/login', {
        replace: true,
        state: { message: result?.message ?? 'Registration successful. Please verify your email.' },
      })
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#003366] via-[#004080] to-[#005299] relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <FaGraduationCap className="w-12 h-12 text-[#003366]" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">Join Smart Campus!</h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            Create your student account and get access to all campus resources and services.
          </p>
          <div className="mt-12 space-y-4 text-left max-w-sm">
            {[
              'Access your courses and grades',
              'Book campus facilities',
              'Get instant notifications',
              'Connect with campus community',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#c9a227] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#003366]" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="w-16 h-16 bg-[#003366] rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaGraduationCap className="w-8 h-8 text-[#c9a227]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Campus</h1>
            <p className="text-gray-600">Create your student account</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-600 mt-1">Fill in your details to get started</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
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
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all bg-white text-black appearance-none cursor-pointer"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="LECTURER">Lecturer</option>
                      <option value="TECHNICIAN">Technician</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Administrator</option>
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
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
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
