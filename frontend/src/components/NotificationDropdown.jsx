import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getNotifications, getUnreadCount, markAsRead } from '../services/notificationService'
import { FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa'
import '../styles/NotificationDropdown.css'

export default function NotificationDropdown() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch notifications
  useEffect(() => {
    if (!token) return

    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const data = await getNotifications(token, { page: 0, size: 10 })
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch initially and set up polling
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [token])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markAsRead(token, notification.id)
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }

    // Navigate to notifications page with the notification details
    navigate('/notifications', { state: { selectedNotification: notification } })
    setIsOpen(false)
  }

  const getNotificationIcon = (type) => {
    const iconProps = { className: 'w-5 h-5' }
    switch (type) {
      case 'SUCCESS':
        return <FaCheckCircle {...iconProps} className="w-5 h-5 text-green-600" />
      case 'WARNING':
        return <FaExclamationCircle {...iconProps} className="w-5 h-5 text-yellow-600" />
      case 'ERROR':
        return <FaTimesCircle {...iconProps} className="w-5 h-5 text-red-600" />
      case 'INFO':
      default:
        return <FaInfoCircle {...iconProps} className="w-5 h-5 text-blue-600" />
    }
  }

  const formatTimeAgo = (createdAt) => {
    const now = new Date()
    const notifTime = new Date(createdAt)
    const diffMs = now - notifTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return notifTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Notifications"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="notification-dropdown-menu">
          {/* Header */}
          <div className="notification-dropdown-header">
            <h3 className="notification-dropdown-title">Notifications</h3>
            {unreadCount > 0 && (
              <span className="notification-unread-badge">{unreadCount} new</span>
            )}
          </div>

          {/* Notifications List */}
          <div className="notification-dropdown-list">
            {loading && (
              <div className="notification-item-loading">
                <div className="animate-spin">Loading...</div>
              </div>
            )}

            {!loading && notifications.length === 0 ? (
              <div className="notification-item-empty">
                <FaBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`notification-item ${!notification.isRead ? 'unread' : 'read'}`}
                >
                  <div className="notification-item-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-title">{notification.title}</div>
                    <div className="notification-item-message">{notification.message}</div>
                    <div className="notification-item-time">
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="notification-item-indicator"></div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button
                onClick={() => {
                  navigate('/notifications')
                  setIsOpen(false)
                }}
                className="notification-view-all-button"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
