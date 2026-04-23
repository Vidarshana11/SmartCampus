import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import resourceService from '../services/resourceService';

const BookingCreate = () => {
  const { token, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: ''
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await resourceService.getAllResources(token);
        setResources(data.filter(r => r.status === 'ACTIVE'));
      } catch {
        setError('Failed to load resources.');
      }
    };
    if (token) fetchResources();
  }, [token]);

  useEffect(() => {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    if (!authLoading && isAdmin) {
      navigate('/bookings/admin', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        resourceId: parseInt(form.resourceId),
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null
      };
      await bookingService.createBooking(token, payload);
      setSuccess('Booking submitted successfully! Awaiting approval.');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking. The time slot may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight">New Booking</h1>
          <button
            onClick={() => navigate('/bookings')}
            className="text-sm font-black text-gray-500 hover:text-black uppercase tracking-widest transition-colors"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-5 mb-6 text-red-800 rounded-xl flex items-center gap-3">
            <span className="text-2xl font-bold">!</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 p-5 mb-6 text-green-800 rounded-xl flex items-center gap-3">
            <span className="text-2xl font-bold">✓</span>
            <span className="font-semibold">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-50 p-8 rounded-2xl border border-gray-200 space-y-6">

          {/* Resource */}
          <div className="flex flex-col">
            <label className="text-sm font-black mb-2 text-black uppercase tracking-wide">Resource *</label>
            <select
              name="resourceId"
              value={form.resourceId}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select a resource...</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.location} (Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div className="flex flex-col">
            <label className="text-sm font-black mb-2 text-black uppercase tracking-wide">Start Time *</label>
            <input
              type="datetime-local"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* End Time */}
          <div className="flex flex-col">
            <label className="text-sm font-black mb-2 text-black uppercase tracking-wide">End Time *</label>
            <input
              type="datetime-local"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Purpose */}
          <div className="flex flex-col">
            <label className="text-sm font-black mb-2 text-black uppercase tracking-wide">Purpose *</label>
            <textarea
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe the purpose of this booking..."
              className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Expected Attendees */}
          <div className="flex flex-col">
            <label className="text-sm font-black mb-2 text-black uppercase tracking-wide">Expected Attendees</label>
            <input
              type="number"
              name="expectedAttendees"
              value={form.expectedAttendees}
              onChange={handleChange}
              min="1"
              placeholder="e.g. 25"
              className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingCreate;