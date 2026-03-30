import { useState, useCallback } from 'react'
import { getAdminBookings, approveAdminBooking, rejectAdminBooking } from '../../services/adminService'
import DataTable from './DataTable'
import StatusBadge from './StatusBadge'

export default function BookingManagementTab({ token }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Filtering
  const [selectedStatus, setSelectedStatus] = useState('PENDING')

  // Reject modal
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch bookings
  const fetchBookings = useCallback(
    async (currentPage = 0) => {
      try {
        setLoading(true)
        setError(null)

        const result = await getAdminBookings(token, {
          page: currentPage,
          size: pageSize,
          status: selectedStatus || null,
        })

        setBookings(result.content || [])
        setTotalElements(result.totalElements || 0)
        setPage(currentPage)
      } catch (err) {
        console.error('Failed to fetch bookings:', err)
        setError('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    },
    [token, pageSize, selectedStatus]
  )

  // Approve booking
  const handleApprove = async (bookingId) => {
    try {
      setLoading(true)
      await approveAdminBooking(token, bookingId)
      setSuccess('Booking approved successfully')
      await fetchBookings(page)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to approve booking')
    } finally {
      setLoading(false)
    }
  }

  // Reject booking
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
      await fetchBookings(page)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to reject booking')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'id', label: 'ID', width: '60px', render: (v) => `#${v}` },
    {
      key: 'resource',
      label: 'Resource',
      render: (v) => v?.name || '--',
    },
    {
      key: 'user',
      label: 'User',
      render: (v) => v?.name || '--',
    },
    {
      key: 'startTime',
      label: 'Start Time',
      render: (v) => (v ? new Date(v).toLocaleString() : '--'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
  ]

  const actions = [
    {
      label: 'Approve',
      variant: 'approve',
      onClick: (booking) => handleApprove(booking.id),
      disabled: (booking) => booking.status !== 'PENDING',
    },
    {
      label: 'Reject',
      variant: 'reject',
      onClick: (booking) => {
        setRejectingId(booking.id)
      },
      disabled: (booking) => booking.status !== 'PENDING',
    },
  ]

  return (
    <div className="space-y-4">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium animate-slideDown">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium animate-slideDown">
          {error}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn" onClick={() => setRejectingId(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-[90%] overflow-hidden animate-slideUp" onClick={(e) => e.stopPropagation()}>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-inherit resize-vertical"
              />
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setRejectingId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleRejectSubmit}
                disabled={loading || !rejectReason.trim()}
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        error={error}
        pagination={{ current: page, size: pageSize, total: totalElements }}
        onPageChange={(newPage) => fetchBookings(newPage)}
        onFilter={(status) => {
          setSelectedStatus(status)
          setPage(0)
        }}
        filterOptions={[
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
        filterLabel="Status"
        actions={actions}
        emptyMessage="No bookings found"
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }
      `}</style>
    </div>
  )
}
