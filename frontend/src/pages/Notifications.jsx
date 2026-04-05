import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from '../services/notificationService'
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaTrash,
  FaCheckDouble,
  FaArrowLeft,
} from 'react-icons/fa'
import '../styles/NotificationsPage.css'

export default function NotificationsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const selectedNotif = location.state?.selectedNotification

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' or 'unread'
  const [selectedNotification, setSelectedNotification] = useState(selectedNotif || null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch notifications
  useEffect(() => {
    if (!token) return

    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const data = await getNotifications(token, {
          page,
          size: 20,
          unreadOnly: filter === 'unread',
        })
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        setTotalPages(data.totalPages || 1)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [token, filter, page])

  const handleNotificationClick = async (notification) => {
    try {
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
      console.error('Failed to mark as read:', error)
    }
    setSelectedNotification(notification)
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(token)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(token, notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    const iconProps = { className: 'w-6 h-6' }
    switch (type) {
      case 'SUCCESS':
        return <FaCheckCircle {...iconProps} className="w-6 h-6 text-green-600" />
      case 'WARNING':
        return <FaExclamationCircle {...iconProps} className="w-6 h-6 text-yellow-600" />
      case 'ERROR':
        return <FaTimesCircle {...iconProps} className="w-6 h-6 text-red-600" />
      case 'INFO':
      default:
        return <FaInfoCircle {...iconProps} className="w-6 h-6 text-blue-600" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800'
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {/* Header */}
        <div className="notifications-header">
          <div className="notifications-header-content">
            <button
              onClick={() => navigate(-1)}
              className="back-button"
              title="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div className="notifications-header-title">
              <h1>Your Notifications</h1>
              {unreadCount > 0 && (
                <span className="notifications-unread-count">{unreadCount} Unread</span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="mark-all-button"
              title="Mark all as read"
            >
              <FaCheckDouble className="w-4 h-4" />
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="notifications-filters">
          <button
            onClick={() => setFilter('all')}
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`filter-button ${filter === 'unread' ? 'active' : ''}`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="notifications-layout">
          {/* Notifications List */}
          <div className="notifications-list-section">
            {loading ? (
              <div className="notifications-loading">
                <div className="animate-spin">Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <FaInfoCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3>No {filter === 'unread' ? 'unread' : ''} notifications</h3>
                <p>
                  {filter === 'unread'
                    ? 'You are all caught up!'
                    : 'Check back later for new notifications.'}
                </p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`notification-list-item ${
                      !notification.isRead ? 'unread' : ''
                    } ${selectedNotification?.id === notification.id ? 'selected' : ''}`}
                  >
                    <div className="notification-list-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-list-content">
                      <div className="notification-list-title">
                        {notification.title}
                      </div>
                      <div className="notification-list-message">
                        {notification.message}
                      </div>
                      <div className="notification-list-time">
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="notification-indicator"></div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="notifications-pagination">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="pagination-button"
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="pagination-button"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Detail */}
          {selectedNotification && (
            <div className="notification-detail-section">
              <div className="notification-detail">
                <div className="notification-detail-header">
                  <div className="notification-detail-icon">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div className="notification-detail-meta">
                    <h2 className="notification-detail-title">
                      {selectedNotification.title}
                    </h2>
                    <div className="notification-detail-info">
                      <span className={`notification-type-badge ${getTypeColor(selectedNotification.type)}`}>
                        {selectedNotification.type}
                      </span>
                      <span className="notification-detail-time">
                        {formatDate(selectedNotification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="notification-detail-content">
                  <p>{selectedNotification.message}</p>
                </div>

                {selectedNotification.category && (
                  <div className="notification-detail-category">
                    <strong>Category:</strong> {selectedNotification.category}
                  </div>
                )}

                <div className="notification-detail-actions">
                  {!selectedNotification.isRead && (
                    <button
                      onClick={async () => {
                        await markAsRead(token, selectedNotification.id)
                        setSelectedNotification({
                          ...selectedNotification,
                          isRead: true,
                        })
                      }}
                      className="action-button mark-read"
                    >
                      <FaCheckCircle className="w-4 h-4" />
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(selectedNotification.id)}
                    className="action-button delete"
                  >
                    <FaTrash className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
