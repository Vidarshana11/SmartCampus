import { useState, useCallback, useEffect } from 'react'
import { approveAdminBooking, rejectAdminBooking } from '../../services/adminService'
import bookingService from '../../services/bookingService'

const statusColors = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

export default function BookingManagementTab({ token }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Analytics state
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(true)

  // Filter
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Reject modal
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // QR modal
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true)
        const data = await bookingService.getAnalytics(token)
        setAnalytics(data)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    if (token) fetchAnalytics()
  }, [token])

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await bookingService.getAllBookings(token)
      setBookings(data)
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) fetchBookings()
  }, [token, fetchBookings])

  // Approve
  const handleApprove = async (bookingId) => {
    try {
      setLoading(true)
      await approveAdminBooking(token, bookingId)
      setSuccess('Booking approved successfully')
      await fetchBookings()
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to approve booking')
    } finally {
      setLoading(false)
    }
  }

  // Reject submit
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    try {
      setLoading(true)
      await rejectAdminBooking(token, rejectingId, rejectReason)
      setSuccess('Booking rejected successfully')
      setRejectingId(null)
      setRejectReason('')
      await fetchBookings()
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to reject booking')
    } finally {
      setLoading(false)
    }
  }

  // QR Code
  const handleShowQR = async (id) => {
    setQrLoading(true)
    try {
      const data = await bookingService.getBookingQR(token, id)
      setQrData(data)
    } catch {
      alert('Failed to load QR code.')
    } finally {
      setQrLoading(false)
    }
  }

  const formatDateTime = (dt) => {
    if (!dt) return '-'
    return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const peakHour = analytics
    ? Object.entries(analytics.bookingsByHour || {}).sort((a, b) => b[1] - a[1])[0]
    : null

  const filteredBookings = selectedStatus === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === selectedStatus)

  return (
    <div className="space-y-6">

      {/* Analytics Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Booking Analytics</h2>
            <p className="text-sm text-gray-500">Live overview of all booking activity</p>
          </div>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAnalytics ? 'Hide ▲' : 'Show ▼'}
          </button>
        </div>

        {showAnalytics && (
          <div className="p-6">
            {analyticsLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                Loading analytics...
              </div>
            ) : analytics ? (
              <>
                {/* Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Total',     value: analytics.totalBookings,     bg: 'bg-gray-900', text: 'text-white' },
                    { label: 'Pending',   value: analytics.pendingBookings,   bg: 'bg-yellow-50', text: 'text-yellow-800' },
                    { label: 'Approved',  value: analytics.approvedBookings,  bg: 'bg-green-50',  text: 'text-green-800' },
                    { label: 'Rejected',  value: analytics.rejectedBookings,  bg: 'bg-red-50',    text: 'text-red-800' },
                    { label: 'Cancelled', value: analytics.cancelledBookings, bg: 'bg-gray-100',  text: 'text-gray-700' },
                  ].map(card => (
                    <div key={card.label} className={`${card.bg} ${card.text} rounded-xl p-4 text-center`}>
                      <p className="text-2xl font-black">{card.value}</p>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Top Resources + Peak Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Resources */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Top Resources</h3>
                    {analytics.topResources?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.topResources?.map((r, i) => (
                          <div key={r.resourceId} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-lg font-black text-gray-300 w-6">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{r.resourceName}</p>
                              <p className="text-xs text-gray-500">{r.bookingCount} bookings</p>
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (r.bookingCount / (analytics.totalBookings || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Peak Hours */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Peak Booking Hours</h3>
                    {peakHour && (
                      <div className="bg-blue-600 text-white rounded-xl p-3 mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase opacity-80">Peak Hour</p>
                          <p className="text-2xl font-black">{peakHour[0]}:00</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-80">Bookings</p>
                          <p className="text-2xl font-black">{peakHour[1]}</p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {Object.entries(analytics.bookingsByHour || {})
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([hour, count]) => (
                          <div key={hour} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 w-10">{hour}:00</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-gray-800 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (count / (peakHour?.[1] || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-4">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Analytics unavailable.</p>
            )}
          </div>
        )}
      </div>

      {/* Success / Error */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* QR Modal */}
      {qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center">
            <h2 className="text-xl font-black uppercase mb-2">Booking QR Code</h2>
            <p className="text-gray-500 text-sm mb-6">Show this at the venue for check-in</p>
            <img
              src={`data:image/png;base64,${qrData.qrCode}`}
              alt="Booking QR Code"
              className="mx-auto w-56 h-56 border border-gray-200 rounded-xl"
            />
            <p className="text-xs text-gray-400 mt-4">Booking ID: {qrData.bookingId}</p>
            <button
              onClick={() => setQrData(null)}
              className="mt-6 bg-black text-white px-8 py-2 rounded-full font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setRejectingId(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-[90%] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Booking</h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 text-sm mb-4">Please provide a reason for rejection:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-vertical"
              />
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                onClick={() => setRejectingId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
                onClick={handleRejectSubmit}
                disabled={loading || !rejectReason.trim()}
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Card Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-900">All Bookings</h2>
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                  selectedStatus === s
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 font-bold text-gray-600">Loading bookings...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-bold uppercase">
              No bookings found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.map(booking => (
                <div key={booking.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
                  <div className="p-5 flex-grow">

                    {/* Status + ID */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className="text-xs text-gray-400 font-bold">#{booking.id}</span>
                    </div>

                    {/* Resource Name */}
                    <h3 className="text-base font-black text-black mb-3 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                      {booking.resourceName}
                    </h3>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-16 uppercase">User</span>
                        <span className="text-xs font-bold text-gray-900">{booking.userName}</span>
                      </div>
                      <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-16 uppercase">Purpose</span>
                        <span className="text-xs font-bold text-gray-900 truncate">{booking.purpose}</span>
                      </div>
                      <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-16 uppercase">Start</span>
                        <span className="text-xs font-bold text-gray-900">{formatDateTime(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-16 uppercase">End</span>
                        <span className="text-xs font-bold text-gray-900">{formatDateTime(booking.endTime)}</span>
                      </div>
                      {booking.expectedAttendees && (
                        <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-xs font-black text-gray-400 w-16 uppercase">People</span>
                          <span className="text-xs font-bold text-gray-900">{booking.expectedAttendees}</span>
                        </div>
                      )}
                      {booking.rejectionReason && (
                        <div className="flex items-start bg-red-50 p-2 rounded-lg border border-red-100">
                          <span className="text-xs font-black text-red-400 w-16 uppercase shrink-0">Reason</span>
                          <span className="text-xs font-bold text-red-700">{booking.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2 flex-wrap">
                    {booking.status === 'APPROVED' && (
                      <button
                        onClick={() => handleShowQR(booking.id)}
                        disabled={qrLoading}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
                      >
                        QR Code
                      </button>
                    )}
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(booking.id)}
                          disabled={loading}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-full font-black text-xs uppercase hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(booking.id)}
                          className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-black text-xs uppercase hover:bg-red-600 hover:text-white transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}