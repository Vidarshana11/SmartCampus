import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import {
  FaUsers,
  FaBell,
  FaChartBar,
  FaCog,
  FaClipboardList,
  FaChevronLeft,
  FaChevronRight,
  FaTicketAlt,
} from 'react-icons/fa'
import AdminDashboard from '../../pages/admin/AdminDashboard'
import TicketList from '../../pages/TicketList'
import UserManagement from '../../pages/admin/UserManagement'
import NotificationsPanel from '../../pages/admin/NotificationsPanel'
import ReportsPanel from '../../pages/admin/ReportsPanel'
import SystemSettings from '../../pages/admin/SystemSettings'
import AuditLogs from '../../pages/admin/AuditLogs'
import '../../styles/admin/AdminLayout.css'

const ADMIN_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartBar, component: AdminDashboard },
  { id: 'tickets', label: 'Tickets', icon: FaTicketAlt, component: () => <TicketList hideHeader={true} /> },
  { id: 'users', label: 'User Management', icon: FaUsers, component: UserManagement },
  { id: 'notifications', label: 'Announcements', icon: FaBell, component: NotificationsPanel },
  { id: 'reports', label: 'Reports & Analytics', icon: FaChartBar, component: ReportsPanel },
  { id: 'settings', label: 'System Settings', icon: FaCog, component: SystemSettings },
  { id: 'audit', label: 'Audit Logs', icon: FaClipboardList, component: AuditLogs },
]

export default function AdminLayout() {
  const { loading } = useAuth()
  const [activeModule, setActiveModule] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div>Loading admin panel...</div>
      </div>
    )
  }

  const currentModule = ADMIN_MODULES.find((m) => m.id === activeModule)
  const CurrentComponent = currentModule.component

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Admin Panel</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        <nav className="admin-nav">
          {ADMIN_MODULES.map((module) => {
            const IconComponent = module.icon
            return (
              <button
                key={module.id}
                className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
                onClick={() => setActiveModule(module.id)}
                title={module.label}
              >
                <IconComponent className="nav-icon" />
                {sidebarOpen && <span className="nav-label">{module.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <div className="content-header">
          <h1>{currentModule.label}</h1>
        </div>
        <div className="content-body">
          <CurrentComponent />
        </div>
      </main>
    </div>
  )
}
