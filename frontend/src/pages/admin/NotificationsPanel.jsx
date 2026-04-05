import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { broadcastNotification, createAnnouncement } from '../../services/notificationService'
import { FaCheck, FaTimes, FaSpinner, FaBell, FaUsers } from 'react-icons/fa'
import '../../styles/admin/NotificationsPanel.css'

const NOTIFICATION_TYPES = [
  { value: 'INFO', label: 'Info', color: 'bg-blue-100 text-blue-800' },
  { value: 'WARNING', label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ERROR', label: 'Error', color: 'bg-red-100 text-red-800' },
  { value: 'SUCCESS', label: 'Success', color: 'bg-green-100 text-green-800' },
]

const ROLES = [
  { value: 'STUDENT', label: 'Students' },
  { value: 'LECTURER', label: 'Lecturers' },
  { value: 'TECHNICIAN', label: 'Technicians' },
  { value: 'MANAGER', label: 'Managers' },
  { value: 'ADMIN', label: 'Admins' },
]

export default function NotificationsPanel() {
  const { token } = useAuth()

  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('INFO')
  const [recipientType, setRecipientType] = useState('all')
  const [selectedRoles, setSelectedRoles] = useState([])
  const [numRecipients, setNumRecipients] = useState(0)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [sentNotifications, setSentNotifications] = useState([])

  const handleRoleToggle = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const estimateRecipients = () => {
    // This is a rough estimation - in production, you'd get exact counts from backend
    if (recipientType === 'all') {
      setNumRecipients(Math.floor(Math.random() * 500) + 200) // Random for demo
    } else if (selectedRoles.length > 0) {
      // Rough estimate based on role count
      setNumRecipients(selectedRoles.length * 50)
    } else {
      setNumRecipients(0)
    }
  }

  useEffect(() => {
    estimateRecipients()
  }, [recipientType, selectedRoles])

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (recipientType === 'roles' && selectedRoles.length === 0) {
      setError('Please select at least one role')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      let response
      if (recipientType === 'all') {
        // Send to all users
        response = await broadcastNotification(token, {
          title: title.trim(),
          message: message.trim(),
          type,
          category: 'SYSTEM',
          targetRoles: [],
        })
      } else {
        // Send to specific roles
        response = await createAnnouncement(token, {
          title: title.trim(),
          message: message.trim(),
          targetRoles: selectedRoles,
        })
      }

      const recipientCount = parseInt(response.recipientCount) || numRecipients

      const recipientCount = parseInt(response.recipientCount) || numRecipients

      // Add to sent notifications list
      const notification = {
        id: Date.now(),
        title: title.trim(),
        message: message.trim(),
        type,
        sentAt: new Date().toLocaleString(),
        recipients:
          recipientType === 'all'
            ? 'All users'
            : selectedRoles.map((r) => ROLES.find((role) => role.value === r)?.label).join(', '),
        recipientCount,
        status: 'sent',
      }

      setSentNotifications((prev) => [notification, ...prev])
      setSuccess(`Notification sent successfully to ${recipientCount} recipient(s)`)

      // Reset form
      setTitle('')
      setMessage('')
      setType('INFO')
      setRecipientType('all')
      setSelectedRoles([])

      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      let errorMessage = 'Failed to send notification. Please try again.'

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.'
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to send notifications.'
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid request. Please check your input.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notifications-panel space-y-6">
      {/* Alert Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium flex items-center gap-2 animate-slideDown">
          <FaCheck className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center gap-2 animate-slideDown">
          <FaTimes className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Send Notification Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Send Notification</h2>
          <p className="text-gray-600 text-sm">Broadcast messages to users across the platform</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 resize-vertical"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
        </div>

        {/* Notification Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Notification Type</label>
          <div className="flex gap-3 flex-wrap">
            {NOTIFICATION_TYPES.map((notifType) => (
              <button
                key={notifType.value}
                onClick={() => setType(notifType.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  type === notifType.value
                    ? `${notifType.color} ring-2 ring-offset-2 ring-gray-400`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {notifType.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Send To</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="radio"
                name="recipient"
                value="all"
                checked={recipientType === 'all'}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">All Users</p>
                <p className="text-xs text-gray-600">Send to entire campus community</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="radio"
                name="recipient"
                value="roles"
                checked={recipientType === 'roles'}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">Specific Roles</p>
                <p className="text-xs text-gray-600">Send to selected user roles only</p>
              </div>
            </label>
          </div>

          {/* Role Selection */}
          {recipientType === 'roles' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
              {ROLES.map((role) => (
                <label key={role.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-gray-900 font-medium">{role.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Recipients Estimate */}
        {(recipientType === 'all' || selectedRoles.length > 0) && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-900">
            <FaUsers className="w-5 h-5" />
            <span className="text-sm font-medium">
              This notification will be sent to approximately <strong>{numRecipients}</strong> user(s)
            </span>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendNotification}
          disabled={
            loading ||
            !title.trim() ||
            !message.trim() ||
            (recipientType === 'roles' && selectedRoles.length === 0)
          }
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <FaSpinner className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <FaBell className="w-4 h-4" />
              Send Notification
            </>
          )}
        </button>
      </div>

      {/* Sent Notifications History */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Sent Notifications</h3>
          <p className="text-sm text-gray-600 mt-1">
            {sentNotifications.length} notification(s) sent in this session
          </p>
        </div>

        {sentNotifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FaBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications sent yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Notifications you send will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {sentNotifications.map((notif) => (
              <div key={notif.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          NOTIFICATION_TYPES.find((t) => t.value === notif.type)?.color
                        }`}
                      >
                        {notif.type}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>To: {notif.recipients}</span>
                      <span>({notif.recipientCount} recipients)</span>
                      <span>{notif.sentAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <FaCheck className="w-5 h-5" />
                    <span className="text-sm font-medium">Sent</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
