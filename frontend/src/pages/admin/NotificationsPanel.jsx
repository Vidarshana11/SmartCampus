import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { createAnnouncement } from '../../services/notificationService'
import { getRoles } from '../../services/roleService'
import '../../styles/admin/NotificationsPanel.css'

export default function NotificationsPanel() {
  const { token } = useAuth()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sentHistory, setSentHistory] = useState([])

  useEffect(() => {
    if (!token) return

    const fetchAvailableRoles = async () => {
      try {
        setLoadingRoles(true)
        const roles = await getRoles(token)
        setAvailableRoles(roles || [])
      } catch (err) {
        console.error('Failed to load roles:', err)
        setError('Failed to load roles. You can still send to all users.')
      } finally {
        setLoadingRoles(false)
      }
    }

    fetchAvailableRoles()
  }, [token])

  const canSubmit = useMemo(() => {
    if (!title.trim() || !message.trim()) return false
    if (targetType === 'roles' && selectedRoles.length === 0) return false
    return !submitting
  }, [title, message, targetType, selectedRoles, submitting])

  const toggleRole = (roleName) => {
    setSelectedRoles((prev) => (
      prev.includes(roleName)
        ? prev.filter((role) => role !== roleName)
        : [...prev, roleName]
    ))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.')
      return
    }

    if (targetType === 'roles' && selectedRoles.length === 0) {
      setError('Select at least one role for role-based notifications.')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        title: title.trim(),
        message: message.trim(),
        targetRoles: targetType === 'roles' ? selectedRoles : [],
      }

      const response = await createAnnouncement(token, payload)
      const recipientCount = Number(response?.recipientCount ?? 0)
      const targetLabel = targetType === 'roles' ? selectedRoles.join(', ') : 'All users'

      setSentHistory((prev) => [
        {
          id: Date.now(),
          title: payload.title,
          message: payload.message,
          targetLabel,
          recipientCount,
          sentAt: new Date().toLocaleString(),
        },
        ...prev.slice(0, 9),
      ])

      setSuccess(`Notification sent successfully to ${recipientCount} user(s).`)
      setTitle('')
      setMessage('')
      setTargetType('all')
      setSelectedRoles([])
    } catch (err) {
      console.error('Failed to send notification:', err)
      setError(
        err?.response?.data?.error
        || err?.response?.data?.message
        || err?.message
        || 'Failed to send notification. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="notifications-admin-panel">
      <section className="notifications-admin-card">
        <h2>Create Role-Based Notification</h2>
        <p>Send to all users or to selected roles based on each user profile role.</p>

        {success && <div className="notifications-alert success">{success}</div>}
        {error && <div className="notifications-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="notifications-form">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter notification title"
              maxLength={120}
              required
            />
          </label>

          <label>
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Enter notification message"
              rows={5}
              maxLength={1000}
              required
            />
          </label>

          <fieldset className="notifications-target-picker">
            <legend>Target Audience</legend>
            <label className="target-option">
              <input
                type="radio"
                name="targetType"
                value="all"
                checked={targetType === 'all'}
                onChange={(event) => setTargetType(event.target.value)}
              />
              All users
            </label>
            <label className="target-option">
              <input
                type="radio"
                name="targetType"
                value="roles"
                checked={targetType === 'roles'}
                onChange={(event) => setTargetType(event.target.value)}
              />
              Specific roles
            </label>
          </fieldset>

          {targetType === 'roles' && (
            <div className="notifications-roles">
              {loadingRoles && <p>Loading roles...</p>}
              {!loadingRoles && availableRoles.length === 0 && (
                <p className="roles-empty">No roles available right now.</p>
              )}
              {!loadingRoles && availableRoles.map((role) => (
                <label key={role.name} className="role-chip">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => toggleRole(role.name)}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
          )}

          <button type="submit" disabled={!canSubmit}>
            {submitting ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </section>

      <section className="notifications-admin-card">
        <h3>Recently Sent</h3>
        {sentHistory.length === 0 ? (
          <p className="history-empty">No notifications sent in this session.</p>
        ) : (
          <div className="history-list">
            {sentHistory.map((item) => (
              <article key={item.id} className="history-item">
                <div className="history-item-header">
                  <strong>{item.title}</strong>
                  <span>{item.sentAt}</span>
                </div>
                <p>{item.message}</p>
                <div className="history-meta">
                  <span>Targets: {item.targetLabel}</span>
                  <span>Recipients: {item.recipientCount}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
