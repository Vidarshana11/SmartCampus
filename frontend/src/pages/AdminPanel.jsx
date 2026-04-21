import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FaBell,
  FaCog,
  FaUsers,
  FaBuilding,
  FaCalendarCheck,
  FaBullhorn,
  FaChartLine,
  FaSpinner,
  FaSignOutAlt,
  FaEdit,
  FaTimes,
  FaTrash,
  FaToggleOff,
  FaToggleOn,
  FaTicketAlt,
} from 'react-icons/fa'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAdminStats } from '../services/adminService'
import {
  deleteAdminNotificationHistory,
  getAnnouncementUrgencyMeta,
  getAdminNotificationHistory,
  updateAdminNotificationHistory,
} from '../services/notificationService'
import UserManagementTab from '../components/admin/UserManagementTab'
import ResourceManagementTab from '../components/admin/ResourceManagementTab'
import BookingManagementTab from '../components/admin/BookingManagementTab'
import TicketManagementTab from '../components/admin/TicketManagementTab'
import TicketUpdateTab from '../components/admin/TicketUpdateTab'
import AnnouncementsTab from '../components/admin/AnnouncementsTab'
import ReportsTab from '../components/admin/ReportsTab'
import AdminSettingsTab from '../components/admin/AdminSettingsTab'
import AdminNotificationBell from '../components/notifications/AdminNotificationBell'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
  { id: 'tickets', label: 'Tickets', icon: FaTicketAlt },
  { id: 'ticket-update', label: 'Update Ticket', icon: FaEdit },
  { id: 'users', label: 'Users', icon: FaUsers },
  { id: 'resources', label: 'Resources', icon: FaBuilding },
  { id: 'bookings', label: 'Bookings', icon: FaCalendarCheck },
  { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { id: 'reports', label: 'Reports', icon: FaChartLine },
  { id: 'account', label: 'Account Settings', icon: FaCog },
]

export default function AdminPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [notificationHistory, setNotificationHistory] = useState([])
  const [editingNotificationId, setEditingNotificationId] = useState(null)
  const [editDraft, setEditDraft] = useState({ title: '', message: '' })
  const [savingCampaignId, setSavingCampaignId] = useState(null)

  usePageTitle('Admin Panel')

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    const ticketIdParam = searchParams.get('ticketId')

    if (tabParam && TABS.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam)
    }

    if (tabParam === 'ticket-update' && ticketIdParam) {
      const parsedTicketId = Number(ticketIdParam)
      if (Number.isInteger(parsedTicketId) && parsedTicketId > 0) {
        setSelectedTicketId(parsedTicketId)
      }
    }
  }, [location.search])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch dashboard statistics
        const adminStats = await getAdminStats(token)
        setStats(adminStats)
      } catch (err) {
        console.error('Failed to fetch admin stats:', err)
        setError('Failed to load dashboard statistics')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchStats()
    }
  }, [token])

  const fetchNotificationHistory = async () => {
    if (!token) return

    try {
      setNotificationsLoading(true)
      setNotificationsError('')
      const history = await getAdminNotificationHistory(token)
      setNotificationHistory(history)
    } catch (err) {
      console.error('Failed to load notification history:', err)
      setNotificationsError('Failed to load notifications')
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleOpenNotifications = async () => {
    setNotificationsOpen(true)
    await fetchNotificationHistory()
  }

  const handleCloseNotifications = () => {
    setNotificationsOpen(false)
    setEditingNotificationId(null)
    setEditDraft({ title: '', message: '' })
  }

  const handleToggleNotification = async (notification) => {
    try {
      setSavingCampaignId(notification.campaignId)
      const updated = await updateAdminNotificationHistory(
        token,
        notification.campaignId,
        { enabled: !notification.isEnabled }
      )
      setNotificationHistory((previous) =>
        previous.map((item) => (
          item.campaignId === notification.campaignId ? updated : item
        ))
      )
      setNotificationsError('')
    } catch (err) {
      console.error('Failed to toggle notification:', err)
      setNotificationsError(
        err?.response?.data?.error || err?.response?.data?.message || 'Failed to update notification status'
      )
    } finally {
      setSavingCampaignId(null)
    }
  }

  const handleEditStart = (notification) => {
    setEditingNotificationId(notification.campaignId)
    setEditDraft({
      title: notification.title,
      message: notification.message,
    })
  }

  const handleEditSave = async (notification) => {
    if (!editDraft.title.trim() || !editDraft.message.trim()) return
    try {
      setSavingCampaignId(notification.campaignId)
      const updated = await updateAdminNotificationHistory(
        token,
        notification.campaignId,
        {
          title: editDraft.title.trim(),
          message: editDraft.message.trim(),
        }
      )
      setNotificationHistory((previous) =>
        previous.map((item) => (
          item.campaignId === notification.campaignId ? updated : item
        ))
      )
      setNotificationsError('')
      setEditingNotificationId(null)
      setEditDraft({ title: '', message: '' })
    } catch (err) {
      console.error('Failed to edit notification:', err)
      setNotificationsError(
        err?.response?.data?.error || err?.response?.data?.message || 'Failed to save notification changes'
      )
    } finally {
      setSavingCampaignId(null)
    }
  }

  const handleEditCancel = () => {
    setEditingNotificationId(null)
    setEditDraft({ title: '', message: '' })
  }

  const handleDeleteNotification = async (notification) => {
    const shouldDelete = window.confirm(
      'Delete this past notification for all recipients? This action cannot be undone.'
    )
    if (!shouldDelete) return

    try {
      setSavingCampaignId(notification.campaignId)
      await deleteAdminNotificationHistory(token, notification.campaignId)
      setNotificationHistory((previous) =>
        previous.filter((item) => item.campaignId !== notification.campaignId)
      )
      setNotificationsError('')
      if (editingNotificationId === notification.campaignId) {
        setEditingNotificationId(null)
        setEditDraft({ title: '', message: '' })
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
      setNotificationsError(
        err?.response?.data?.error || err?.response?.data?.message || 'Failed to delete notification'
      )
    } finally {
      setSavingCampaignId(null)
    }
  }

  const formatNotificationTime = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString()
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab stats={stats} loading={loading} error={error} />
      case 'tickets':
        return <TicketManagementTab onSelectTicket={(id) => {
          setSelectedTicketId(id)
          setActiveTab('ticket-update')
        }} />
      case 'ticket-update':
        return (
          <TicketUpdateTab 
            ticketId={selectedTicketId} 
            onBack={() => setActiveTab('tickets')} 
          />
        )
      case 'users':
        return <UserManagementTab token={token} />
      case 'resources':
        return <ResourceManagementTab token={token} />
      case 'bookings':
        return <BookingManagementTab token={token} />
      case 'announcements':
        return <AnnouncementsTab token={token} />
      case 'reports':
        return <ReportsTab token={token} />
      case 'account':
        return <AdminSettingsTab />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage campus operations, users, and resources</p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Admin Notification Bell - for ticket alerts and admin notifications */}
              <AdminNotificationBell />

              <button
                onClick={handleOpenNotifications}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <FaBell className="w-4 h-4" />
                View Announcements
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <FaCog className="w-4 h-4" />
                Account Settings
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                <FaSignOutAlt className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[89px] z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            {TABS.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">{renderTabContent()}</div>

      {/* Notifications History Modal */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center px-4"
          onClick={handleCloseNotifications}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Past Announcements</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View previous announcements and manage enable/disable and edit state.
                </p>
              </div>
              <button
                onClick={handleCloseNotifications}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close notifications"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
              {notificationsLoading && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Loading announcements...
                </div>
              )}

              {!notificationsLoading && notificationsError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {notificationsError}
                </div>
              )}

              {!notificationsLoading && !notificationsError && notificationHistory.length === 0 && (
                <div className="p-4 rounded-lg bg-gray-50 text-sm text-gray-600">
                  No past announcements found.
                </div>
              )}

              {!notificationsLoading && !notificationsError && notificationHistory.map((notification) => {
                const urgencyMeta = getAnnouncementUrgencyMeta(notification.type)
                return (
                <article
                  key={notification.campaignId}
                  className={`rounded-lg border p-4 transition ${
                    notification.isEnabled
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-gray-200 bg-gray-100/70 opacity-80'
                  }`}
                >
                  {editingNotificationId === notification.campaignId ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editDraft.title}
                        onChange={(event) => setEditDraft((prev) => ({ ...prev, title: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Notification title"
                      />
                      <textarea
                        value={editDraft.message}
                        onChange={(event) => setEditDraft((prev) => ({ ...prev, message: event.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-vertical"
                        placeholder="Notification message"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSave(notification)}
                          disabled={savingCampaignId === notification.campaignId}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingCampaignId === notification.campaignId ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${urgencyMeta.chipClass}`}>
                            {urgencyMeta.label}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700">
                            Announcement
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{notification.message}</p>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => handleToggleNotification(notification)}
                          disabled={savingCampaignId === notification.campaignId}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            notification.isEnabled
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:opacity-60`}
                        >
                          {notification.isEnabled ? (
                            <FaToggleOn className="w-4 h-4" />
                          ) : (
                            <FaToggleOff className="w-4 h-4" />
                          )}
                          {notification.isEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleEditStart(notification)}
                          disabled={savingCampaignId === notification.campaignId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notification)}
                          disabled={savingCampaignId === notification.campaignId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dashboard Tab Component
function DashboardTab({ stats, loading, error }) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-600">
          <FaSpinner className="w-5 h-5 animate-spin" />
          Loading dashboard statistics...
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Users" value={stats?.totalUsers || 0} color="blue" />
            <StatCard label="Total Resources" value={stats?.totalResources || 0} color="green" />
            <StatCard label="Total Bookings" value={stats?.totalBookings || 0} color="yellow" />
            <StatCard label="Last Updated" value={stats?.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : '--:--'} color="purple" />
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SmartCampus Operations Hub</h2>
              <p className="text-gray-600">Use the tabs above to manage users, resources, facility bookings, and campus announcements.</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors">
                  <FaUsers className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Manage Users</h4>
                    <p className="text-sm text-gray-600">Add, edit, or remove user accounts and manage roles</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:bg-green-50 transition-colors">
                  <FaBuilding className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Manage Resources</h4>
                    <p className="text-sm text-gray-600">Create and manage campus facilities and equipment</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:bg-yellow-50 transition-colors">
                  <FaCalendarCheck className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Approve Bookings</h4>
                    <p className="text-sm text-gray-600">Review and approve facility booking requests</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:bg-purple-50 transition-colors">
                  <FaBullhorn className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Send Announcements</h4>
                    <p className="text-sm text-gray-600">Broadcast messages to campus community</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, color = 'blue' }) {
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-l-blue-600',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-l-4 border-l-green-600',
      text: 'text-green-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-l-4 border-l-yellow-600',
      text: 'text-yellow-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-l-4 border-l-purple-600',
      text: 'text-purple-600',
    },
  }

  const config = colorConfig[color] || colorConfig.blue

  return (
    <div className={`${config.bg} ${config.border} rounded-lg p-6 shadow-sm`}>
      <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${config.text}`}>{value}</p>
    </div>
  )
}

// Announcements Tab - now in separate component
