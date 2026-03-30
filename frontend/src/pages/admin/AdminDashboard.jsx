import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { FaUsers, FaCalendar, FaBuilding, FaCheckCircle } from 'react-icons/fa'
import '../../styles/admin/AdminDashboard.css'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingBookings: 0,
    totalResources: 0,
    approvalRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError('')

        // For now, we'll use placeholder data
        // This will be replaced with actual API calls
        setStats({
          totalUsers: 127,
          pendingBookings: 8,
          totalResources: 24,
          approvalRate: 92,
        })
      } catch (err) {
        setError('Failed to load dashboard statistics')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FaUsers />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-change">+12 this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bookings">
            <FaCalendar />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingBookings}</div>
            <div className="stat-label">Pending Bookings</div>
            <div className="stat-change">Awaiting approval</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resources">
            <FaBuilding />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalResources}</div>
            <div className="stat-label">Campus Resources</div>
            <div className="stat-change">2 unavailable</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approval">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.approvalRate}%</div>
            <div className="stat-label">Approval Rate</div>
            <div className="stat-change">This month</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Quick Start</h2>
        <div className="quick-actions">
          <div className="action-item">
            <h3>📋 User Management</h3>
            <p>Manage users, assign roles, and view user activities</p>
          </div>
          <div className="action-item">
            <h3>📢 Announcements</h3>
            <p>Create and broadcast system announcements</p>
          </div>
          <div className="action-item">
            <h3>📊 Reports</h3>
            <p>View analytics, reports, and system statistics</p>
          </div>
          <div className="action-item">
            <h3>⚙️ Settings</h3>
            <p>Configure system settings and preferences</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>System Status</h2>
        <div className="system-status">
          <div className="status-item">
            <span className="status-indicator online"></span>
            <div>
              <div className="status-name">API Server</div>
              <div className="status-info">Running normally</div>
            </div>
          </div>
          <div className="status-item">
            <span className="status-indicator online"></span>
            <div>
              <div className="status-name">Database</div>
              <div className="status-info">Connected</div>
            </div>
          </div>
          <div className="status-item">
            <span className="status-indicator online"></span>
            <div>
              <div className="status-name">File Storage</div>
              <div className="status-info">Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
