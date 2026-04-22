import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';

const BookingAnalytics = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await bookingService.getAnalytics(token);
        setAnalytics(data);
      } catch {
        setError('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetch();
  }, [token]);

  const peakHour = analytics
    ? Object.entries(analytics.bookingsByHour).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight">Booking Analytics</h1>
          <button
            onClick={() => navigate('/bookings/admin')}
            className="text-sm font-black text-gray-500 hover:text-black uppercase tracking-widest"
          >
            ← Back to Bookings
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-5 mb-8 text-red-800 rounded-xl">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : analytics && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {[
                { label: 'Total', value: analytics.totalBookings, color: 'bg-gray-900 text-white' },
                { label: 'Pending', value: analytics.pendingBookings, color: 'bg-yellow-100 text-yellow-900' },
                { label: 'Approved', value: analytics.approvedBookings, color: 'bg-green-100 text-green-900' },
                { label: 'Rejected', value: analytics.rejectedBookings, color: 'bg-red-100 text-red-900' },
                { label: 'Cancelled', value: analytics.cancelledBookings, color: 'bg-gray-100 text-gray-700' },
              ].map(card => (
                <div key={card.label} className={`${card.color} rounded-2xl p-6 text-center shadow-sm`}>
                  <p className="text-3xl font-black mb-1">{card.value}</p>
                  <p className="text-xs font-black uppercase tracking-widest opacity-70">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Top Resources */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-black uppercase tracking-tight mb-5">Top Resources</h2>
                {analytics.topResources.length === 0 ? (
                  <p className="text-gray-400 font-bold">No data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topResources.map((r, i) => (
                      <div key={r.resourceId} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                        <span className="text-2xl font-black text-gray-300">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="font-black text-black uppercase text-sm">{r.resourceName}</p>
                          <p className="text-xs text-gray-500 font-bold">{r.bookingCount} bookings</p>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (r.bookingCount / analytics.totalBookings) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Peak Hours */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-black uppercase tracking-tight mb-5">Peak Booking Hours</h2>
                {peakHour && (
                  <div className="bg-blue-600 text-white rounded-xl p-4 mb-4 text-center">
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Peak Hour</p>
                    <p className="text-3xl font-black">{peakHour[0]}:00</p>
                    <p className="text-sm opacity-80">{peakHour[1]} bookings</p>
                  </div>
                )}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(analytics.bookingsByHour)
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .map(([hour, count]) => (
                      <div key={hour} className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-500 w-12">{hour}:00</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-black h-2 rounded-full"
                            style={{ width: `${Math.min(100, (count / (peakHour?.[1] || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-gray-700 w-6">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingAnalytics;