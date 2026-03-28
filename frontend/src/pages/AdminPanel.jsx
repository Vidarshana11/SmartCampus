import {
  FaUsers,
  FaClipboardCheck,
  FaTicketAlt,
  FaChartBar,
  FaBell,
  FaCog,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa'
import { usePageTitle } from '../hooks/usePageTitle'

// Mock data for admin dashboard
const stats = [
  { label: 'Total Users', value: '1,234', change: '+12%', icon: FaUsers, color: 'bg-blue-500' },
  { label: 'Pending Bookings', value: '23', change: '+5', icon: FaClipboardCheck, color: 'bg-yellow-500' },
  { label: 'Open Tickets', value: '45', change: '-3', icon: FaTicketAlt, color: 'bg-orange-500' },
  { label: 'Active Events', value: '8', change: '+2', icon: FaCalendarAlt, color: 'bg-green-500' },
]

const recentUsers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@campus.edu', role: 'Student', joined: '2 hours ago', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@campus.edu', role: 'Student', joined: '5 hours ago', status: 'active' },
  { id: 3, name: 'Carol White', email: 'carol@campus.edu', role: 'Admin', joined: '1 day ago', status: 'active' },
  { id: 4, name: 'David Brown', email: 'david@campus.edu', role: 'Student', joined: '2 days ago', status: 'pending' },
]

const pendingBookings = [
  { id: 1, facility: 'Study Room A', user: 'Alice Johnson', date: 'Mar 28, 2026', time: '10:00 AM - 12:00 PM', status: 'pending' },
  { id: 2, facility: 'Lab 301', user: 'Bob Smith', date: 'Mar 29, 2026', time: '2:00 PM - 4:00 PM', status: 'pending' },
  { id: 3, facility: 'Conference Room B', user: 'Carol White', date: 'Mar 30, 2026', time: '9:00 AM - 11:00 AM', status: 'pending' },
]

const supportTickets = [
  { id: 'TKT-001', subject: 'Cannot access course materials', user: 'Alice Johnson', priority: 'high', status: 'open' },
  { id: 'TKT-002', subject: 'Room booking not confirmed', user: 'Bob Smith', priority: 'medium', status: 'open' },
  { id: 'TKT-003', subject: 'Password reset request', user: 'Carol White', priority: 'low', status: 'in-progress' },
]

export default function AdminPanel() {
  usePageTitle('Admin Panel')
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, bookings, and system operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors">
            <FaBell className="w-4 h-4" />
            Notifications
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FaCog className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <span className={`text-xs font-medium mt-1 inline-flex items-center ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last week
                </span>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Bookings */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaClipboardCheck className="text-[#c9a227]" />
                Pending Bookings
              </h2>
              <button className="text-sm text-[#003366] hover:underline">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Facility</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{booking.facility}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{booking.user}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{booking.date}</div>
                        <div className="text-xs text-gray-500">{booking.time}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <FaCheckCircle className="w-5 h-5" />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <FaExclamationTriangle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Support Tickets */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaTicketAlt className="text-[#c9a227]" />
                Support Tickets
              </h2>
              <button className="text-sm text-[#003366] hover:underline">View all</button>
            </div>
            <div className="divide-y divide-gray-100">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">{ticket.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ticket.status === 'open' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1">Submitted by {ticket.user}</p>
                    </div>
                    <button className="text-[#003366] hover:underline text-sm font-medium">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaUsers className="text-[#c9a227]" />
                Recent Users
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentUsers.map((user) => (
                <div key={user.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#004080] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button className="w-full py-2 text-sm text-[#003366] font-medium hover:bg-gray-50 rounded-lg transition-colors">
                View all users
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#003366] to-[#004080] rounded-xl p-5 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FaChartBar className="text-[#c9a227]" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Add New User', icon: FaUsers },
                { label: 'Create Announcement', icon: FaBell },
                { label: 'System Settings', icon: FaCog },
                { label: 'View Reports', icon: FaChartBar },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              {[
                { name: 'Web Server', status: 'Operational', color: 'green' },
                { name: 'Database', status: 'Operational', color: 'green' },
                { name: 'Email Service', status: 'Degraded', color: 'yellow' },
                { name: 'File Storage', status: 'Operational', color: 'green' },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{service.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${
                    service.color === 'green' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      service.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaClock className="w-4 h-4" />
                Last updated: 5 minutes ago
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
