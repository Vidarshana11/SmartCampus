import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  FaBell,
  FaArrowRight,
  FaClock,
  FaCalendarCheck,
  FaTicketAlt,
  FaBuilding,
  FaPlus,
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { getAnnouncementUrgencyMeta, getDashboardAnnouncements } from '../services/notificationService'
import bookingService from '../services/bookingService'
import ticketService from '../services/ticketService'
import resourceService from '../services/resourceService'

export default function Dashboard() {
  const { token, user } = useAuth()
  usePageTitle('Dashboard')
  const userName = user?.name || 'Student'
  const [announcements, setAnnouncements] = useState([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [announcementsError, setAnnouncementsError] = useState('')
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets] = useState([])
  const [resources, setResources] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardErrors, setDashboardErrors] = useState({
    bookings: '',
    tickets: '',
    resources: '',
  })

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
    const loadDashboardData = async () => {
      setDashboardLoading(true)
      setDashboardErrors({ bookings: '', tickets: '', resources: '' })

      const [bookingsResult, ticketsResult, resourcesResult] = await Promise.allSettled([
        bookingService.getMyBookings(token),
        ticketService.getTickets(token),
        resourceService.getAllResources(token),
      ])

      if (cancelled) return

      if (bookingsResult.status === 'fulfilled') {
        setBookings(bookingsResult.value)
      } else {
        setDashboardErrors((prev) => ({ ...prev, bookings: 'Unable to load bookings' }))
      }

      if (ticketsResult.status === 'fulfilled') {
        setTickets(ticketsResult.value)
      } else {
        setDashboardErrors((prev) => ({ ...prev, tickets: 'Unable to load tickets' }))
      }

      if (resourcesResult.status === 'fulfilled') {
        setResources(resourcesResult.value)
      } else {
        setDashboardErrors((prev) => ({ ...prev, resources: 'Unable to load resources' }))
      }

      setDashboardLoading(false)
    }

    loadDashboardData()

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

  const formatBookingDateTime = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const upcomingBookings = bookings
    .filter((booking) => (
      booking.startTime
      && new Date(booking.startTime) > new Date()
      && booking.status !== 'CANCELLED'
      && booking.status !== 'REJECTED'
    ))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 4)

  const openTicketsCount = tickets.filter((ticket) => ticket.status === 'OPEN').length
  const inProgressTicketsCount = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length
  const resolvedTicketsCount = tickets.filter((ticket) => ticket.status === 'RESOLVED').length
  const activeTicketCount = openTicketsCount + inProgressTicketsCount
  const activeResourcesCount = resources.filter((resource) => resource.status === 'ACTIVE').length
  const roomCount = resources.filter((resource) => resource.type === 'ROOM').length
  const labCount = resources.filter((resource) => resource.type === 'LAB').length
  const equipmentCount = resources.filter((resource) => resource.type === 'EQUIPMENT').length

  const getMetricValue = (value) => (dashboardLoading ? '...' : value)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0b3f6e] via-[#0d5a8c] to-[#137a8a] rounded-2xl p-6 text-white shadow-lg border border-white/20">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="text-blue-50/90 mt-1">
              Welcome back to your portal. Check the latest announcements below.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-sky-50 to-blue-100 rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-800">My Bookings</span>
            <FaCalendarCheck className="text-blue-700" />
          </div>
          <div className="text-3xl font-bold text-blue-950">{getMetricValue(bookings.length)}</div>
          {dashboardErrors.bookings && <p className="text-xs text-red-600 mt-2">{dashboardErrors.bookings}</p>}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-amber-800">Active Tickets</span>
            <FaTicketAlt className="text-amber-700" />
          </div>
          <div className="text-3xl font-bold text-amber-950">{getMetricValue(activeTicketCount)}</div>
          {dashboardErrors.tickets && <p className="text-xs text-red-600 mt-2">{dashboardErrors.tickets}</p>}
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border border-teal-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-teal-800">Resources Available</span>
            <FaBuilding className="text-teal-700" />
          </div>
          <div className="text-3xl font-bold text-teal-950">{getMetricValue(activeResourcesCount)}</div>
          {dashboardErrors.resources && <p className="text-xs text-red-600 mt-2">{dashboardErrors.resources}</p>}
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-indigo-100 rounded-xl border border-indigo-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-indigo-800">Latest Announcements</span>
            <FaBell className="text-indigo-700" />
          </div>
          <div className="text-3xl font-bold text-indigo-950">{announcementsLoading ? '...' : announcements.length}</div>
          {announcementsError && <p className="text-xs text-red-600 mt-2">{announcementsError}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaBell className="text-indigo-600" />
            Announcements
          </h2>
          <Link to="/announcements" className="text-sm text-[#0d4f82] hover:underline font-medium flex items-center gap-1">
            View all <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {announcementsLoading && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-600">
              Loading announcements...
            </div>
          )}

          {!announcementsLoading && announcementsError && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-sm text-red-700">
              {announcementsError}
            </div>
          )}

          {!announcementsLoading && !announcementsError && announcements.length === 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-600">
              No announcements available right now.
            </div>
          )}

          {!announcementsLoading && !announcementsError && announcements.map((announcement) => {
            const urgencyMeta = getAnnouncementUrgencyMeta(announcement.type)
            return (
              <div
                key={announcement.id}
                className={`bg-gradient-to-r from-white to-slate-50 rounded-xl p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow ${
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
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Announcement
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{announcement.title}</h3>
                    <p className="text-sm text-slate-600">{announcement.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-slate-900">
                      {formatAnnouncementDate(announcement.createdAt)}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <FaClock className="w-3 h-3" /> {formatAnnouncementTime(announcement.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0f3d63] to-[#136f8f] rounded-xl border border-cyan-600/40 p-4 shadow-md">
          <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/bookings/create"
              className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              <span className="flex items-center gap-2">
                <FaPlus className="text-cyan-200" />
                New Booking
              </span>
              <FaArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/tickets/create"
              className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              <span className="flex items-center gap-2">
                <FaPlus className="text-cyan-200" />
                Report Incident
              </span>
              <FaArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/resources"
              className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              <span className="flex items-center gap-2">
                <FaBuilding className="text-cyan-200" />
                Browse Resources
              </span>
              <FaArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/announcements"
              className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              <span className="flex items-center gap-2">
                <FaBell className="text-cyan-200" />
                View Announcements
              </span>
              <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-200 p-4 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Bookings</h2>
            <Link to="/bookings" className="text-sm text-[#0d4f82] hover:underline font-medium">See all</Link>
          </div>

          {dashboardErrors.bookings && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-sm text-red-700">
              {dashboardErrors.bookings}
            </div>
          )}

          {!dashboardErrors.bookings && dashboardLoading && (
            <div className="text-sm text-gray-600">Loading upcoming bookings...</div>
          )}

          {!dashboardErrors.bookings && !dashboardLoading && upcomingBookings.length === 0 && (
            <div className="text-sm text-gray-600">No upcoming bookings yet.</div>
          )}

          {!dashboardErrors.bookings && !dashboardLoading && upcomingBookings.length > 0 && (
            <div className="space-y-2">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-cyan-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{booking.resourceName}</p>
                      <p className="text-xs text-slate-600">{booking.purpose}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-cyan-100 text-cyan-800">
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Starts: {formatBookingDateTime(booking.startTime)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 p-4 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Ticket Snapshot</h2>
            <Link to="/tickets" className="text-sm text-[#9a3412] hover:underline font-medium">Manage tickets</Link>
          </div>

          {dashboardErrors.tickets && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-sm text-red-700">
              {dashboardErrors.tickets}
            </div>
          )}

          {!dashboardErrors.tickets && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs text-amber-700">Open</div>
                <div className="text-xl font-semibold text-amber-900">{getMetricValue(openTicketsCount)}</div>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="text-xs text-orange-700">In Progress</div>
                <div className="text-xl font-semibold text-orange-900">{getMetricValue(inProgressTicketsCount)}</div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-xs text-emerald-700">Resolved</div>
                <div className="text-xl font-semibold text-emerald-900">{getMetricValue(resolvedTicketsCount)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Resource Mix</h2>

          {dashboardErrors.resources && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-sm text-red-700">
              {dashboardErrors.resources}
            </div>
          )}

          {!dashboardErrors.resources && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-emerald-100/70 px-3 py-2">
                <span className="text-emerald-800">Rooms</span>
                <span className="font-semibold text-emerald-950">{getMetricValue(roomCount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-teal-100/70 px-3 py-2">
                <span className="text-teal-800">Labs</span>
                <span className="font-semibold text-teal-950">{getMetricValue(labCount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-cyan-100/70 px-3 py-2">
                <span className="text-cyan-800">Equipment</span>
                <span className="font-semibold text-cyan-950">{getMetricValue(equipmentCount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
