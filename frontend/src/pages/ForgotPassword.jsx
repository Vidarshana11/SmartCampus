import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaEnvelope, FaGraduationCap } from 'react-icons/fa'
import { requestPasswordReset } from '../services/authService'
import { usePageTitle } from '../hooks/usePageTitle'

export default function ForgotPassword() {
  usePageTitle('Forgot Password')

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const data = await requestPasswordReset(email)
      setMessage(
        data?.message ?? 'If this email exists, a password reset link has been sent.'
      )
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Unable to process request right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#003366] rounded-xl flex items-center justify-center mx-auto mb-4">
            <FaGraduationCap className="w-8 h-8 text-[#c9a227]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600 mt-1">Enter your email to receive a reset link.</p>
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

        <form onSubmit={onSubmit} className="space-y-4">
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
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-[#003366] hover:underline font-medium">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
