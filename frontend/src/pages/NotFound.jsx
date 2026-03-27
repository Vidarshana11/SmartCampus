import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { FaHome, FaSearch, FaGraduationCap } from 'react-icons/fa'

export default function NotFound() {
  const { token } = useAuth()
  const location = useLocation()
  const isLoggedIn = !!token

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-[#003366] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <FaGraduationCap className="w-10 h-10 text-[#c9a227]" />
        </div>

        {/* Error Code */}
        <div className="text-8xl font-bold text-[#003366] mb-4">404</div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>

        {/* Current Path Display */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-8">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Requested Path</div>
          <code className="text-sm text-gray-700 font-mono">{location.pathname}</code>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#003366] hover:bg-[#004080] text-white font-semibold rounded-xl transition-colors shadow-md"
              >
                <FaHome className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <Link
                to="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                <FaSearch className="w-4 h-4" />
                Search
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#003366] hover:bg-[#004080] text-white font-semibold rounded-xl transition-colors shadow-md"
              >
                <FaHome className="w-4 h-4" />
                Back to Home
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Need help?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="#" className="text-[#003366] hover:underline">Contact Support</Link>
            <Link to="#" className="text-[#003366] hover:underline">Help Center</Link>
            <Link to="#" className="text-[#003366] hover:underline">IT Services</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
