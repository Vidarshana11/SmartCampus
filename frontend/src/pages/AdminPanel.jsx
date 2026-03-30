import { useState, useEffect } from 'react'
import { FaBell, FaCog, FaUsers, FaBuilding, FaCalendarCheck, FaBullhorn, FaChartLine, FaSpinner } from 'react-icons/fa'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAdminStats } from '../services/adminService'
import UserManagementTab from '../components/admin/UserManagementTab'
import ResourceManagementTab from '../components/admin/ResourceManagementTab'
import BookingManagementTab from '../components/admin/BookingManagementTab'
import AnnouncementsTab from '../components/admin/AnnouncementsTab'
import ReportsTab from '../components/admin/ReportsTab'
import AdminSettingsTab from '../components/admin/AdminSettingsTab'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
  { id: 'users', label: 'Users', icon: FaUsers },
  { id: 'resources', label: 'Resources', icon: FaBuilding },
  { id: 'bookings', label: 'Bookings', icon: FaCalendarCheck },
  { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { id: 'reports', label: 'Reports', icon: FaChartLine },
  { id: 'account', label: 'Account Settings', icon: FaCog },
]

export default function AdminPanel() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  usePageTitle('Admin Panel')

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab stats={stats} loading={loading} error={error} />
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
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <FaBell className="w-4 h-4" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <FaCog className="w-4 h-4" />
                Account Settings
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
