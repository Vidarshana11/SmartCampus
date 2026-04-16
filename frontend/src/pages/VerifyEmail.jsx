import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../services/authService'
import { usePageTitle } from '../hooks/usePageTitle'

export default function VerifyEmail() {
  usePageTitle('Verify Email')
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Verification token is missing.')
        return
      }
      try {
        const result = await verifyEmail(token)
        if (!cancelled) {
          setStatus('success')
          setMessage(result?.message ?? 'Email verified successfully.')
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setMessage(err?.response?.data?.error ?? 'Invalid or expired verification token.')
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Email Verification</h1>
        <p className={status === 'error' ? 'text-red-700 mb-6' : 'text-gray-700 mb-6'}>{message}</p>
        {status === 'loading' ? (
          <div className="w-8 h-8 border-4 border-[#003366]/20 border-t-[#003366] rounded-full animate-spin mx-auto" />
        ) : (
          <Link to="/login" className="text-[#003366] hover:underline font-semibold">
            Continue to login
          </Link>
        )}
      </div>
    </div>
  )
}
