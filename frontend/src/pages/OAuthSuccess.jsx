import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { FaGraduationCap } from 'react-icons/fa'

export default function OAuthSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('token')
  }, [location.search])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }
      try {
        await loginWithToken(token)
        if (!cancelled) navigate('/dashboard', { replace: true })
      } catch {
        if (!cancelled) navigate('/login', { replace: true })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [token, loginWithToken, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-[#003366] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FaGraduationCap className="w-8 h-8 text-[#c9a227]" />
        </div>

        <div className="text-xl font-bold text-gray-900 mb-2">Signing you in...</div>
        <div className="text-gray-600 mb-6">
          Completing authentication with your account provider.
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-[#003366]/20 border-t-[#003366] rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}
