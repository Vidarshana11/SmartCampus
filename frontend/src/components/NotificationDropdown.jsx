import { FaBellSlash, FaCheckCircle, FaRegCircle } from 'react-icons/fa'
import '../styles/NotificationDropdown.css'

const getTypeLabel = (type) => {
  switch (type) {
    case 'SUCCESS':
      return 'Success'
    case 'WARNING':
      return 'Warning'
    case 'ERROR':
      return 'Error'
    case 'INFO':
    default:
      return 'Info'
  }
}

const formatTimeAgo = (dateString) => {
  if (!dateString) return ''

  const createdAt = new Date(dateString)
  const now = Date.now()
  const diffMs = now - createdAt.getTime()

  if (diffMs < 60 * 1000) return 'Just now'
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))}m ago`
  if (diffMs < 24 * 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`

  return createdAt.toLocaleDateString()
}

export default function NotificationDropdown({
  isOpen,
  loading,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
}) {
  if (!isOpen) return null

  return (
    <div className="notification-dropdown" role="menu" aria-label="Recent notifications">
      <div className="notification-dropdown-header">
        <div>
          <h4>Recent Notifications</h4>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notification-dropdown-mark-all"
            onClick={onMarkAllAsRead}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-dropdown-list">
        {loading && <p className="notification-dropdown-state">Loading notifications...</p>}

        {!loading && notifications.length === 0 && (
          <div className="notification-dropdown-empty">
            <FaBellSlash />
            <p>No recent notifications</p>
          </div>
        )}

        {!loading && notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={`notification-dropdown-item ${notification.isRead ? 'read' : 'unread'}`}
            onClick={() => onNotificationClick(notification)}
          >
            <div className="notification-dropdown-item-header">
              <span className="notification-dropdown-type">{getTypeLabel(notification.type)}</span>
              <span className="notification-dropdown-time">
                {formatTimeAgo(notification.createdAt)}
              </span>
            </div>
            <h5>{notification.title}</h5>
            <p>{notification.message}</p>
            <div className="notification-dropdown-status">
              {notification.isRead ? (
                <>
                  <FaCheckCircle />
                  <span>Read</span>
                </>
              ) : (
                <>
                  <FaRegCircle />
                  <span>Unread</span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
