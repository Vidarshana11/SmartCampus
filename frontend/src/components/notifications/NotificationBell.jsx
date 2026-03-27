import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { getUnreadCount } from '../../services/notificationService'
import NotificationPanel from './NotificationPanel'
import './NotificationBell.css'

/**
 * Member 4: Notification Bell Component
 * Shows unread count and opens notification panel
 */
export default function NotificationBell() {
  const { token, user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [error, setError] = useState(null)

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (!token || !user) return

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount(token)
        setUnreadCount(count)
      } catch (err) {
        console.error('Error fetching unread count:', err)
        setError('Failed to fetch notifications')
      }
    }

    // Initial fetch
    fetchUnreadCount()

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [token, user])

  const handleBellClick = () => {
    setIsPanelOpen(true)
    // Reset unread count locally when opening
    setUnreadCount(0)
  }

  const handlePanelClose = () => {
    setIsPanelOpen(false)
    // Refresh unread count after closing panel
    if (token) {
      getUnreadCount(token)
        .then(setUnreadCount)
        .catch(console.error)
    }
  }

  if (!user) return null

  return (
    <>
      <button
        className="notification-bell"
        onClick={handleBellClick}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {error && (
        <div className="notification-error" role="alert">
          {error}
        </div>
      )}

      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
      />
    </>
  )
}
