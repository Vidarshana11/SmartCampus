/**
 * Admin Notification Bell Component
 * Displays admin-specific notifications (ADMIN_ALERT category)
 * These are separate from user notifications and include:
 * - New ticket alerts
 * - System warnings
 * - Admin-only announcements
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { FaBell, FaCheck, FaTrash, FaTicketAlt } from 'react-icons/fa'
import { useAuth } from '../../auth/AuthProvider'
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from '../../services/notificationService'
import './NotificationBell.css'

export default function AdminNotificationBell() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await getAdminNotifications(token, { page: 0, size: 20 })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return
    try {
      const count = await getAdminUnreadCount(token)
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to fetch admin unread count:', err)
    }
  }, [token])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAdminNotificationAsRead(token, notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAdminNotificationsAsRead(token)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  // Get notification icon based on category
  const getNotificationIcon = (notification) => {
    if (notification.category === 'ADMIN_ALERT' && notification.relatedEntityType === 'TICKET') {
      return <FaTicketAlt className="notification-icon ticket-icon" />
    }
    return <FaBell className="notification-icon" />
  }

  // Format relative time
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        className="notification-bell-button admin-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Admin Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge admin-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown admin-notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <h3>Admin Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <FaCheck /> Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <FaBell className="empty-icon" />
                <p>No admin notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="unread-indicator">New</span>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <button
                      className="mark-read-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id)
                      }}
                      title="Mark as read"
                    >
                      <FaCheck />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              <span>{notifications.length} notifications</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
