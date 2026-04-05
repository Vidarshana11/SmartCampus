import { useState } from 'react'
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa'
import { ANNOUNCEMENT_URGENCY, createAnnouncement } from '../../services/notificationService'

const URGENCY_LEVELS = [
  { value: ANNOUNCEMENT_URGENCY.NORMAL, label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: ANNOUNCEMENT_URGENCY.IMPORTANT, label: 'Important', color: 'bg-amber-100 text-amber-800' },
  { value: ANNOUNCEMENT_URGENCY.URGENT, label: 'Urgent', color: 'bg-red-100 text-red-800' },
]

export default function AnnouncementsTab({ token }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [urgency, setUrgency] = useState(ANNOUNCEMENT_URGENCY.NORMAL)
  const [recipientType, setRecipientType] = useState('all')
  const [selectedRoles, setSelectedRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleRoleToggle = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const handleSendAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    if (recipientType === 'roles' && selectedRoles.length === 0) {
      setError('Please select at least one role')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const payload = {
        title: title.trim(),
        message: content.trim(),
        urgency,
        targetRoles: recipientType === 'roles' ? selectedRoles : [],
      }

      const response = await createAnnouncement(token, payload)
      const recipientCount = Number(response?.recipientCount ?? 0)

      setSuccess(`Announcement created and sent to ${recipientCount} user(s)`)
      setTitle('')
      setContent('')
      setUrgency(ANNOUNCEMENT_URGENCY.NORMAL)
      setRecipientType('all')
      setSelectedRoles([])

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to create announcement:', err)
      setError(
        err?.response?.data?.error
        || err?.response?.data?.message
        || err?.message
        || 'Failed to create announcement. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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

      {/* Create Announcement Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Create Announcement</h2>
          <p className="text-gray-600 text-sm">Broadcast messages to campus community</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter announcement title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter announcement content..."
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 resize-vertical"
          />
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Urgency Level</label>
          <div className="flex gap-3 flex-wrap">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setUrgency(level.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  urgency === level.value
                    ? `${level.color} ring-2 ring-offset-2 ring-gray-400`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Type */}
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
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('STUDENT')}
                  onChange={() => handleRoleToggle('STUDENT')}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-gray-900 font-medium">Students</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('LECTURER')}
                  onChange={() => handleRoleToggle('LECTURER')}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-gray-900 font-medium">Lecturers</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('TECHNICIAN')}
                  onChange={() => handleRoleToggle('TECHNICIAN')}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-gray-900 font-medium">Technicians</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('MANAGER')}
                  onChange={() => handleRoleToggle('MANAGER')}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-gray-900 font-medium">Managers</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('ADMIN')}
                  onChange={() => handleRoleToggle('ADMIN')}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-gray-900 font-medium">Admins</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('USER')}
                  onChange={() => handleRoleToggle('USER')}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-gray-900 font-medium">Users (Default)</span>
              </label>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendAnnouncement}
          disabled={loading || !title.trim() || !content.trim() || (recipientType === 'roles' && selectedRoles.length === 0)}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <FaSpinner className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Announcement'
          )}
        </button>
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
      `}</style>
    </div>
  )
}
