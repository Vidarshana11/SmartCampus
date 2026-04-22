import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaBell, FaClock } from 'react-icons/fa'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAllAnnouncements, getAnnouncementUrgencyMeta } from '../services/notificationService'

export default function Announcements() {
  const { token } = useAuth()
  usePageTitle('Announcements')
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return undefined

    let cancelled = false
    const loadAnnouncements = async (showLoading) => {
      if (showLoading) setLoading(true)
      try {
        const data = await getAllAnnouncements(token)
        if (!cancelled) {
          setAnnouncements(data)
          setError('')
        }
      } catch (err) {
        console.error('Failed to load announcements:', err)
        if (!cancelled) setError('Failed to load announcements')
      } finally {
        if (!cancelled && showLoading) setLoading(false)
      }
    }

    loadAnnouncements(true)
    const interval = setInterval(() => loadAnnouncements(false), 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [token])

  const formatAnnouncementDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAnnouncementTime = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaBell className="text-[#c9a227]" />
            All Announcements
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Admin-posted announcements for your account.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#003366] hover:underline"
        >
          <FaArrowLeft className="w-3 h-3" />
          Back to dashboard
        </Link>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-sm text-gray-600">
          Loading announcements...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && announcements.length === 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-sm text-gray-600">
          No announcements available right now.
        </div>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const urgencyMeta = getAnnouncementUrgencyMeta(announcement.type)
            return (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${urgencyMeta.borderClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyMeta.chipClass}`}>
                        {urgencyMeta.label}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        Announcement
                      </span>
                    </div>
                    <h2 className="font-semibold text-gray-900 mb-1">{announcement.title}</h2>
                    <p className="text-sm text-gray-600">{announcement.message}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAnnouncementDate(announcement.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                      <FaClock className="w-3 h-3" />
                      {formatAnnouncementTime(announcement.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
