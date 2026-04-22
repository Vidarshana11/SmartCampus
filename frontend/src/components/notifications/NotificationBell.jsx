import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import {
  getNotifications,
  isRegularNotification,
  markAsRead,
} from '../../services/notificationService'
import NotificationDropdown from '../NotificationDropdown'
import './NotificationBell.css'

/**
 * Member 4: Notification Bell Component
 * Shows unread count and opens recent notifications dropdown
 */
export default function NotificationBell({ tone = 'light' }) {
  const { token, user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [markAllCandidateIds, setMarkAllCandidateIds] = useState([])
  const dropdownRef = useRef(null)
  const RECENT_LIMIT = 6
  const FETCH_LIMIT = 100

  const syncNotifications = useCallback(async (showLoading = false) => {
    if (!token || !user) return
    if (showLoading) setLoading(true)

    try {
      const data = await getNotifications(token, { page: 0, size: FETCH_LIMIT })
      const allNotifications = Array.isArray(data?.notifications) ? data.notifications : []
      const regularNotifications = allNotifications.filter(isRegularNotification)
      const unreadRegularIds = regularNotifications
        .filter((notification) => !notification.isRead)
        .map((notification) => notification.id)

      setRecentNotifications(regularNotifications.slice(0, RECENT_LIMIT))
      setUnreadCount(unreadRegularIds.length)
      setMarkAllCandidateIds(unreadRegularIds)
      setError(null)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to fetch notifications')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    if (!token || !user) {
      setRecentNotifications([])
      setUnreadCount(0)
      setMarkAllCandidateIds([])
      setIsDropdownOpen(false)
      return undefined
    }

    syncNotifications(true)
    const interval = setInterval(() => syncNotifications(false), 30000)
    return () => clearInterval(interval)
  }, [token, user, syncNotifications])

  useEffect(() => {
    if (!isDropdownOpen) return undefined

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isDropdownOpen])

  const handleBellClick = async () => {
    const opening = !isDropdownOpen
    setIsDropdownOpen(opening)
    if (opening) {
      await syncNotifications(true)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (notification.isRead) return

    try {
      await markAsRead(token, notification.id)
      setRecentNotifications((prev) => prev.map((item) => (
        item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setMarkAllCandidateIds((prev) => prev.filter((id) => id !== notification.id))
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError('Failed to update notification')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      if (markAllCandidateIds.length === 0) return
      await Promise.all(markAllCandidateIds.map((id) => markAsRead(token, id)))
      setRecentNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
      setMarkAllCandidateIds([])
      setError(null)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      setError('Failed to mark all notifications as read')
    }
  }

  if (!user) return null

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        className={`notification-bell ${tone === 'dark' ? 'dark' : 'light'}`}
        onClick={handleBellClick}
        aria-expanded={isDropdownOpen}
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

      <NotificationDropdown
        isOpen={isDropdownOpen}
        loading={loading}
        notifications={recentNotifications}
        unreadCount={unreadCount}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      {error && (
        <div className="notification-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
