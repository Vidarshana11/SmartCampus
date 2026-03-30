import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { FaGraduationCap, FaEye, FaEyeSlash, FaGoogle, FaGithub, FaEnvelope, FaLock } from 'react-icons/fa'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Sign In')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await login({ email, password })
      // Redirect admins to admin panel, others to dashboard
      const redirectPath = user?.role === 'ADMIN' ? '/admin-panel' : '/dashboard'
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Login failed. Please check your credentials.')
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
          <h1 className="text-4xl font-bold mb-4 text-center">Welcome Back!</h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            Access your courses, grades, and campus resources all in one place.
          </p>
          <div className="mt-12 flex items-center gap-8 text-white/60 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">15,000+</div>
              <div>Students</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">500+</div>
              <div>Courses</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div>Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-[#003366] rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaGraduationCap className="w-8 h-8 text-[#c9a227]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Campus</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-600 mt-1">Enter your credentials to continue</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]" />
                    Remember me
                  </label>
                  <Link to="#" className="text-[#003366] hover:underline font-medium">
                    Forgot password?
                  </Link>
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
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <a
                    href="http://localhost:8080/oauth2/authorization/google"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <FaGoogle className="w-5 h-5 text-red-500" />
                    Google
                  </a>
                  <a
                    href="/oauth2/authorization/github"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <FaGithub className="w-5 h-5" />
                    GitHub
                  </a>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#003366] hover:underline font-semibold">
                  Create an account
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
