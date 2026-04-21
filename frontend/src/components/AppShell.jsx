import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getImageUrl } from '../api/apiClient'
import { BRAND_FULL_NAME, BRAND_SHORT_NAME } from '../constants/branding'
import Navbar from './Navbar'
import NotificationBell from './notifications/NotificationBell'
import {
  FaHome,
  FaCalendarAlt,
  FaBook,
  FaTicketAlt,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaGraduationCap,
  FaBuilding,
  FaClipboardList,
  FaSearch
} from 'react-icons/fa'

export default function AppShell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const isAdmin = user?.role === 'ADMIN'
  const userName = user?.name ?? 'Guest'

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const mainNavItems = [
    { to: '/resources', label: 'Resources', icon: FaBuilding },
    { to: '#schedule', label: 'My Schedule', icon: FaCalendarAlt },
    { to: '#courses', label: 'My Courses', icon: FaBook },
    
  ]

  const serviceNavItems = [
    { to: '#bookings', label: 'Facility Booking', icon: FaClipboardList },
    { to: '/tickets', label: 'Support Tickets', icon: FaTicketAlt },
    { to: '#library', label: 'Library', icon: FaBook },
  ]

  const adminNavItems = isAdmin
    ? [{ to: '/admin-panel', label: 'Admin Panel', icon: FaCog }]
    : []

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Navigation Bar */}
      <header className="bg-[#003366] border-b-4 border-[#c9a227] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Brand */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shadow-md">
                  <img src="/universityImage.png" alt="University logo" className="w-full h-full object-contain rounded-md" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-white font-bold text-lg leading-tight">{BRAND_SHORT_NAME}</div>
                  <div className="text-white/60 text-xs">Student Portal</div>
                </div>
              </Link>
            </div>

            {/* Center: Quick Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses, resources, announcements..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/30 text-sm"
                />
              </div>
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:text-right">
                  <div className="text-white text-sm font-medium">{userName}</div>
                  <div className="text-white/60 text-xs">{user?.role || 'Student'}</div>
                </div>
                {user?.profilePictureUrl ? (
                  <img
                    src={getImageUrl(user.profilePictureUrl)}
                    alt={userName}
                    className="w-9 h-9 rounded-full object-cover shadow-md border-2 border-[#c9a227]"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-[#c9a227] to-[#ffd700] rounded-full flex items-center justify-center text-[#003366] font-bold text-sm shadow-md">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky lg:top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-200 ease-in-out`}
        >
          <div className="p-4">
            {/* Date/Time Widget */}
            <div className="bg-gradient-to-br from-[#003366] to-[#004080] rounded-xl p-4 mb-4 text-white">
              <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
              <div className="text-sm text-white/80">{formatDate(currentTime)}</div>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main Menu
              </div>
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#003366] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Services Navigation */}
            <nav className="mt-6 space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Services
              </div>
              {serviceNavItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#003366] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Admin Navigation */}
            {adminNavItems.length > 0 && (
              <nav className="mt-6 space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administration
                </div>
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#c9a227] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}

            {/* User Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-1">
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#003366] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <FaCog className="w-5 h-5" />
                Account Settings
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#003366] text-white/70 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FaGraduationCap className="w-6 h-6 text-[#c9a227]" />
                <span className="font-bold text-white">{BRAND_FULL_NAME}</span>
              </div>
              <p className="text-sm">Empowering students with modern campus management tools.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="hover:text-[#c9a227]">Academic Calendar</Link></li>
                <li><Link to="#" className="hover:text-[#c9a227]">Course Catalog</Link></li>
                <li><Link to="#" className="hover:text-[#c9a227]">Library Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="hover:text-[#c9a227]">Help Center</Link></li>
                <li><Link to="#" className="hover:text-[#c9a227]">IT Support</Link></li>
                <li><Link to="#" className="hover:text-[#c9a227]">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>student.services@campus.edu</li>
                <li>+1 (555) 123-4567</li>
                <li>Mon-Fri: 8AM - 5PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
            © 2026 {BRAND_FULL_NAME}. All rights reserved. IT3030 – Programming Applications and Frameworks
          </div>
        </div>
      </footer>
    </div>
  )
}
