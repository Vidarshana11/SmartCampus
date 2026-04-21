import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { getAdminStats, getUserStatsbyRole, getBookingStats } from '../../services/adminService'
import { FaSpinner, FaDownload } from 'react-icons/fa'

export default function ReportsTab({ token }) {
  const [userStats, setUserStats] = useState(null)
  const [bookingStats, setBookingStats] = useState(null)
  const [adminStats, setAdminStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshingBookings, setRefreshingBookings] = useState(false)

  const refreshReports = async ({ refreshBookingsOnly = false } = {}) => {
    try {
      if (!refreshBookingsOnly) {
        setLoading(true)
      } else {
        setRefreshingBookings(true)
      }
      setError(null)

      if (refreshBookingsOnly) {
        const bookings = await getBookingStats(token)
        setBookingStats(bookings)
        setLastUpdated(new Date())
        return
      }

      const [users, bookings, stats] = await Promise.all([
        getUserStatsbyRole(token),
        getBookingStats(token),
        getAdminStats(token),
      ])

      setUserStats(users)
      setBookingStats(bookings)
      setAdminStats(stats)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setError('Failed to load reports. Please try again.')
    } finally {
      setLoading(false)
      setRefreshingBookings(false)
    }
  }

  useEffect(() => {
    if (token) {
      refreshReports()

      const intervalId = setInterval(() => {
        refreshReports({ refreshBookingsOnly: true })
      }, 5000)

      return () => clearInterval(intervalId)
    }
    return undefined
  }, [token])

  const bookingStatusData = useMemo(
    () => [
      { name: 'Pending', value: bookingStats?.PENDING || 0, fill: '#F59E0B' },
      { name: 'Approved', value: bookingStats?.APPROVED || 0, fill: '#10B981' },
      { name: 'Rejected', value: bookingStats?.REJECTED || 0, fill: '#EF4444' },
      { name: 'Cancelled', value: bookingStats?.CANCELLED || 0, fill: '#6B7280' },
    ],
    [bookingStats]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-gray-600">
        <FaSpinner className="w-5 h-5 animate-spin" />
        Loading reports...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
        {error}
      </div>
    )
  }

  // Mock data for charts (replace with actual data when API provides it)
  const userRoleData = userStats
    ? [
        { name: 'Students', value: userStats.STUDENT || 0, color: '#3B82F6' },
        { name: 'Lecturers', value: userStats.LECTURER || 0, color: '#8B5CF6' },
        { name: 'Technicians', value: userStats.TECHNICIAN || 0, color: '#10B981' },
        { name: 'Managers', value: userStats.MANAGER || 0, color: '#F59E0B' },
        { name: 'Admins', value: userStats.ADMIN || 0, color: '#EF4444' },
      ]
    : [
        { name: 'Students', value: 450, color: '#3B82F6' },
        { name: 'Lecturers', value: 85, color: '#8B5CF6' },
        { name: 'Technicians', value: 40, color: '#10B981' },
        { name: 'Managers', value: 15, color: '#F59E0B' },
        { name: 'Admins', value: 5, color: '#EF4444' },
      ]

  const resourceTypeData = [
    { type: 'Lecture Halls', count: 12, utilization: 85 },
    { type: 'Labs', count: 8, utilization: 72 },
    { type: 'Meeting Rooms', count: 6, utilization: 65 },
    { type: 'Study Rooms', count: 20, utilization: 54 },
    { type: 'Equipment', count: 35, utilization: 45 },
  ]

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 text-sm mt-1">Campus operations analytics and insights</p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Live updates every 5 seconds{refreshingBookings ? ' - refreshing bookings...' : ` - last updated ${lastUpdated.toLocaleTimeString()}`}
            </p>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FaDownload className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium">Total Users</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{adminStats?.totalUsers || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Across all roles</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium">Total Resources</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{adminStats?.totalResources || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Facilities and equipment</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{adminStats?.totalBookings || 0}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <p className="text-gray-600 text-sm font-medium">Avg Utilization</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">68%</p>
          <p className="text-xs text-gray-500 mt-2">Resource average</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userRoleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Utilization */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="utilization" fill="#10B981" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Count by Type */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Resource Utilization Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Resource Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Count</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utilization</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {resourceTypeData.map((resource, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{resource.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{resource.count}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${resource.utilization}%`,
                            backgroundColor:
                              resource.utilization >= 80
                                ? '#10B981'
                                : resource.utilization >= 60
                                  ? '#F59E0B'
                                  : '#3B82F6',
                          }}
                        />
                      </div>
                      <span className="text-gray-700 font-medium">{resource.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        resource.utilization >= 80
                          ? 'bg-green-100 text-green-800'
                          : resource.utilization >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {resource.utilization >= 80 ? 'High' : resource.utilization >= 60 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Insights</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>• Lecture halls have the highest utilization rate at 85%, indicating strong demand</li>
          <li>• Equipment utilization is lower (45%), suggesting opportunity to promote equipment availability</li>
          <li>• 156 approved bookings show healthy facility engagement across campus</li>
          <li>• Student population (450) comprises 80% of all users</li>
        </ul>
      </div>
    </div>
  )
}
