import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';

const statusColors = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const BookingAdmin = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('PENDING');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAllBookings(token);
      setBookings(data);
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await bookingService.approveBooking(token, id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert('Please enter a rejection reason.');
    setActionLoading(true);
    try {
      await bookingService.rejectBooking(token, rejectModal, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight">Booking Management</h1>
          <button
            onClick={() => navigate('/bookings/analytics')}
            className="bg-black text-white px-5 py-2 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all"
          >
            Analytics →
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                filter === s
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-5 mb-8 text-red-800 rounded-xl">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
              <h2 className="text-xl font-black uppercase mb-4">Reject Booking</h2>
              <p className="text-gray-500 text-sm mb-4">Please provide a reason for rejection:</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Enter rejection reason..."
                className="w-full border border-gray-300 p-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-32 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            <span className="ml-4 font-bold text-gray-700">Loading...</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Resource', 'User', 'Purpose', 'Start', 'End', 'Attendees', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-gray-400 font-bold uppercase">
                      No bookings found
                    </td>
                  </tr>
                ) : filtered.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-black text-gray-400">#{booking.id}</td>
                    <td className="px-5 py-4 font-bold">{booking.resourceName}</td>
                    <td className="px-5 py-4 font-bold text-gray-700">{booking.userName}</td>
                    <td className="px-5 py-4 text-gray-600 max-w-xs truncate">{booking.purpose}</td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{formatDateTime(booking.startTime)}</td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{formatDateTime(booking.endTime)}</td>
                    <td className="px-5 py-4 text-gray-600">{booking.expectedAttendees || '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {booking.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(booking.id)}
                            disabled={actionLoading}
                            className="bg-green-600 text-white px-3 py-1 rounded-full font-black text-xs uppercase hover:bg-green-700 transition-all disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal(booking.id)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-black text-xs uppercase hover:bg-red-600 hover:text-white transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingAdmin;