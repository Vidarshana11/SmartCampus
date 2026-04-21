import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';

const statusColors = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const BookingList = () => {
  const { token, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = isAdmin
        ? await bookingService.getAllBookings(token)
        : await bookingService.getMyBookings(token);
      setBookings(data);
      setError('');
    } catch (err) {
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchBookings();
  }, [token, authLoading]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(id);
    try {
      await bookingService.cancelBooking(token, id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleShowQR = async (id) => {
    setQrLoading(true);
    try {
      const data = await bookingService.getBookingQR(token, id);
      setQrData(data);
    } catch (err) {
      alert('Failed to load QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('en-US', {
      dateStyle: 'medium', timeStyle: 'short'
    });
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="font-bold text-xl">Verifying access...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight">
            {isAdmin ? 'All Bookings' : 'My Bookings'}
          </h1>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate('/bookings/analytics')}
                className="bg-black text-white px-5 py-2 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all"
              >
                Analytics
              </button>
            )}
            <button
              onClick={() => navigate('/bookings/create')}
              className="bg-black text-white px-5 py-2 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all"
            >
              + New Booking
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-5 mb-8 text-red-800 rounded-xl flex items-center gap-3">
            <span className="text-2xl font-bold">!</span>
            <span className="font-semibold">{error}</span>
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

        {loading ? (
          <div className="flex justify-center items-center py-32 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            <span className="ml-4 font-bold text-gray-700">Loading Bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-32 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <p className="text-gray-900 font-black text-2xl mb-4">NO BOOKINGS FOUND</p>
            <p className="text-gray-500 font-medium mb-8">You have not made any bookings yet.</p>
            <button
              onClick={() => navigate('/bookings/create')}
              className="bg-black text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all"
            >
              Make a Booking
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
                <div className="p-7 flex-grow">

                  {/* Status Badge */}
                  <div className="flex justify-between items-center mb-5">
                    <span className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-widest ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                    <span className="text-xs text-gray-400 font-bold">#{booking.id}</span>
                  </div>

                  {/* Resource Name */}
                  <h3 className="text-xl font-black text-black mb-4 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                    {booking.resourceName}
                  </h3>

                  {/* Details */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs font-black text-gray-400 w-20 uppercase shrink-0">Purpose</span>
                      <span className="text-sm font-bold text-gray-900">{booking.purpose}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs font-black text-gray-400 w-20 uppercase">Start</span>
                      <span className="text-sm font-bold text-gray-900">{formatDateTime(booking.startTime)}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs font-black text-gray-400 w-20 uppercase">End</span>
                      <span className="text-sm font-bold text-gray-900">{formatDateTime(booking.endTime)}</span>
                    </div>
                    {booking.expectedAttendees && (
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-20 uppercase">Attendees</span>
                        <span className="text-sm font-bold text-gray-900">{booking.expectedAttendees}</span>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-20 uppercase">User</span>
                        <span className="text-sm font-bold text-gray-900">{booking.userName}</span>
                      </div>
                    )}
                    {booking.rejectionReason && (
                      <div className="flex items-start bg-red-50 p-3 rounded-lg border border-red-100">
                        <span className="text-xs font-black text-red-400 w-20 uppercase shrink-0">Reason</span>
                        <span className="text-sm font-bold text-red-700">{booking.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-7 py-4 bg-gray-50 border-t border-gray-100 flex gap-2 flex-wrap">
                  {booking.status === 'APPROVED' && (
                    <button
                      onClick={() => handleShowQR(booking.id)}
                      disabled={qrLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      QR Code
                    </button>
                  )}
                  {(booking.status === 'PENDING' || booking.status === 'APPROVED') && !isAdmin && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                    >
                      {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;