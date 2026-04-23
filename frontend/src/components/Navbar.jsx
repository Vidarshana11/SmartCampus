import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { BRAND_SHORT_NAME } from '../constants/branding'
import NotificationBell from './notifications/NotificationBell'
import {
  FaUser,
  FaSearch,
  FaCalendar,
  FaBook,
  FaTools,
  FaSignOutAlt,
  FaChevronDown,
  FaHome,
  FaCog,
  FaUsers,
  FaExclamationTriangle
} from 'react-icons/fa'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const campusLogo = '/universityImage.png'

  const isAdmin = user?.role === 'ADMIN'
  const userName = user?.name ?? 'Guest'
  const getPortalLabel = () => {
    switch (user?.role) {
      case 'LECTURER':
        return 'Lecturer Portal'
      case 'MANAGER':
        return 'Manager Portal'
      case 'ADMIN':
        return 'Admin Portal'
      default:
        return 'Student Portal'
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: FaHome },
    { to: '/tickets', label: 'Tickets', icon: FaExclamationTriangle },
    { to: '#', label: 'My Schedule', icon: FaCalendar },
    { to: '#', label: 'Library', icon: FaBook },
    { to: '#', label: 'Services', icon: FaTools },
  ]

  if (isAdmin) {
    navLinks.push({ to: '/admin-panel', label: 'Admin', icon: FaCog })
    navLinks.push({ to: '/role-management', label: 'Roles', icon: FaUsers })
  }

  return (
    <nav className="navbar sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={campusLogo} alt="National University of Smart Technologies logo" className="w-10 h-10 rounded-lg object-cover border border-white/20" />
            <div className="hidden sm:block">
              <div className="text-white font-bold text-lg leading-tight">{BRAND_SHORT_NAME}</div>
              <div className="text-white/60 text-xs">{getPortalLabel()}</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `navbar-link flex items-center gap-2 text-sm ${isActive ? 'active' : ''}`
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-lg px-3 py-1.5">
              <FaSearch className="w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-white placeholder-white/50 text-sm ml-2 w-32 lg:w-48"
              />
            </div>

            {/* Notifications - Member 4 Component */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#c9a227] to-[#ffd700] rounded-full flex items-center justify-center text-[#003366] font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:block text-white text-sm font-medium">{userName}</span>
                <FaChevronDown className="w-3 h-3 text-white/60 hidden lg:block" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{userName}</p>
                    <p className="text-sm text-gray-500">{user?.email || 'student@campus.edu'}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#003366]/10 text-[#003366] text-xs font-medium rounded-full">
                      {user?.role || 'Student'}
                    </span>
                  </div>
                  <Link
                    to="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FaUser className="w-4 h-4 text-gray-400" />
                    My Profile
                  </Link>
                  <Link
                    to="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FaCog className="w-4 h-4 text-gray-400" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/10">
        <div className="flex overflow-x-auto px-4 py-2 space-x-4 scrollbar-hide">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm whitespace-nowrap px-3 py-2 rounded-lg ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
