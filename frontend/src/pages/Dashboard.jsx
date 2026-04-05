import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  FaCalendarAlt,
  FaBook,
  FaClipboardCheck,
  FaTicketAlt,
  FaBell,
  FaArrowRight,
  FaClock,
  FaUser,
  FaGraduationCap,
  FaBuilding
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { getAnnouncementUrgencyMeta, getDashboardAnnouncements } from '../services/notificationService'

// Quick actions data
const quickActions = [
  {
    title: 'My Schedule',
    description: 'View classes & events',
    icon: FaCalendarAlt,
    color: 'bg-blue-500',
    href: '#schedule',
  },
  {
    title: 'Grades',
    description: 'Check academic progress',
    icon: FaClipboardCheck,
    color: 'bg-green-500',
    href: '#grades',
  },
  {
    title: 'Library',
    description: 'Books & resources',
    icon: FaBook,
    color: 'bg-purple-500',
    href: '#library',
  },
  {
    title: 'Support',
    description: 'Submit tickets',
    icon: FaTicketAlt,
    color: 'bg-orange-500',
    href: '#support',
  },
]

// Upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: 'Midterm Examination',
    date: 'Mar 28',
    time: '9:00 AM - 12:00 PM',
    location: 'Exam Hall A',
    type: 'exam',
  },
  {
    id: 2,
    title: 'Guest Lecture: AI in Education',
    date: 'Mar 30',
    time: '2:00 PM - 4:00 PM',
    location: 'Lecture Theater 3',
    type: 'lecture',
  },
  {
    id: 3,
    title: 'Student Club Meeting',
    date: 'Apr 2',
    time: '5:00 PM - 6:30 PM',
    location: 'Student Center',
    type: 'club',
  },
]

// Recent grades/assignments
const recentActivity = [
  { id: 1, course: 'IT3030 - PAF', item: 'Assignment 2', grade: '85/100', status: 'graded', date: 'Mar 24' },
  { id: 2, course: 'CS2012 - DSA', item: 'Lab Report 3', grade: 'Pending', status: 'pending', date: 'Mar 26' },
  { id: 3, course: 'MA1012 - Calculus', item: 'Quiz 4', grade: '92/100', status: 'graded', date: 'Mar 22' },
]

export default function Dashboard() {
  const { token, user } = useAuth()
  usePageTitle('Dashboard')
  const userName = user?.name || 'Student'
  const [announcements, setAnnouncements] = useState([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [announcementsError, setAnnouncementsError] = useState('')

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    if (!token) return undefined

    let cancelled = false
    const loadAnnouncements = async (showLoading) => {
      if (showLoading) setAnnouncementsLoading(true)
      try {
        const data = await getDashboardAnnouncements(token, { limit: 8 })
        if (!cancelled) {
          setAnnouncements(data)
          setAnnouncementsError('')
        }
      } catch (err) {
        console.error('Failed to load dashboard announcements:', err)
        if (!cancelled) setAnnouncementsError('Failed to load announcements')
      } finally {
        if (!cancelled && showLoading) setAnnouncementsLoading(false)
      }
    }

    loadAnnouncements(true)
    const interval = setInterval(() => loadAnnouncements(false), 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [token])

  const formatAnnouncementDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const formatAnnouncementTime = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#003366] to-[#004080] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="text-white/80 mt-1">
              Welcome back to your portal. Check the latest announcements below.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-xs text-white/70">Current Semester</div>
              <div className="font-semibold">Spring 2026</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-xs text-white/70">Student ID</div>
              <div className="font-semibold">STU-{user?.id || '000000'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className="group bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#003366]/30 transition-all"
          >
            <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900">{action.title}</h3>
            <p className="text-sm text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements - Takes up 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FaBell className="text-[#c9a227]" />
              Announcements
            </h2>
            <Link to="#" className="text-sm text-[#003366] hover:underline font-medium flex items-center gap-1">
              View all <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {announcementsLoading && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-sm text-gray-600">
                Loading announcements...
              </div>
            )}

            {!announcementsLoading && announcementsError && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-sm text-red-700">
                {announcementsError}
              </div>
            )}

            {!announcementsLoading && !announcementsError && announcements.length === 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-sm text-gray-600">
                No announcements available right now.
              </div>
            )}

            {!announcementsLoading && !announcementsError && announcements.map((announcement) => {
              const urgencyMeta = getAnnouncementUrgencyMeta(announcement.type)
              return (
                <div
                  key={announcement.id}
                  className={`bg-white rounded-xl p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow ${
                    urgencyMeta.borderClass
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          urgencyMeta.chipClass
                        }`}>
                          {urgencyMeta.label}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          Announcement
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                      <p className="text-sm text-gray-600">{announcement.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900">
                        {formatAnnouncementDate(announcement.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <FaClock className="w-3 h-3" /> {formatAnnouncementTime(announcement.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent Activity / Grades */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaGraduationCap className="text-[#c9a227]" />
                Recent Activity
              </h2>
              <Link to="#" className="text-sm text-[#003366] hover:underline font-medium">
                View all grades
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentActivity.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{activity.course}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{activity.item}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'graded'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">{activity.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Events & Info */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-[#c9a227]" />
              Upcoming Events
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#003366] text-white rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-medium uppercase">{event.date.split(' ')[0]}</span>
                    <span className="text-lg font-bold leading-none">{event.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{event.title}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <FaClock className="w-3 h-3" /> {event.time}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <FaBuilding className="w-3 h-3" /> {event.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="#"
              className="mt-4 block text-center text-sm text-[#003366] hover:underline font-medium py-2 border border-dashed border-gray-300 rounded-lg hover:border-[#003366]/30"
            >
              View full calendar
            </Link>
          </div>

          {/* Campus Resources */}
          <div className="bg-gradient-to-br from-[#003366] to-[#004080] rounded-xl p-4 text-white shadow-md">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <FaBuilding className="text-[#c9a227]" />
              Campus Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#" className="flex items-center gap-2 text-white/90 hover:text-white">
                  <FaBook className="w-4 h-4" /> Library Catalogue
                </Link>
              </li>
              <li>
                <Link to="#" className="flex items-center gap-2 text-white/90 hover:text-white">
                  <FaBuilding className="w-4 h-4" /> Room Booking
                </Link>
              </li>
              <li>
                <Link to="#" className="flex items-center gap-2 text-white/90 hover:text-white">
                  <FaTicketAlt className="w-4 h-4" /> IT Help Desk
                </Link>
              </li>
              <li>
                <Link to="#" className="flex items-center gap-2 text-white/90 hover:text-white">
                  <FaUser className="w-4 h-4" /> Academic Advising
                </Link>
              </li>
            </ul>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Student Portal</span>
                <span className="flex items-center gap-1.5 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Library System</span>
                <span className="flex items-center gap-1.5 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email Services</span>
                <span className="flex items-center gap-1.5 text-yellow-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Maintenance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
