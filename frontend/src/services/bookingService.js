import apiClient from '../api/apiClient'

const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const bookingService = {
  // Get my bookings (current user)
  getMyBookings: async (token) => {
    const response = await apiClient.get('/api/bookings/my', {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Get all bookings (Admin/Manager)
  getAllBookings: async (token) => {
    const response = await apiClient.get('/api/bookings', {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Get pending bookings (Admin/Manager)
  getPendingBookings: async (token) => {
    const response = await apiClient.get('/api/bookings/pending', {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Create a new booking
  createBooking: async (token, bookingData) => {
    const response = await apiClient.post('/api/bookings', bookingData, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Approve a booking (Admin/Manager)
  approveBooking: async (token, id) => {
    const response = await apiClient.put(`/api/bookings/${id}/approve`, {}, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Reject a booking (Admin/Manager)
  rejectBooking: async (token, id, reason) => {
    const response = await apiClient.put(`/api/bookings/${id}/reject`, { reason }, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Cancel a booking (own booking)
  cancelBooking: async (token, id) => {
    const response = await apiClient.put(`/api/bookings/${id}/cancel`, {}, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Delete a booking (Admin only)
  deleteBooking: async (token, id) => {
    const response = await apiClient.delete(`/api/bookings/${id}`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Get QR code as base64 (innovation)
  getBookingQR: async (token, id) => {
    const response = await apiClient.get(`/api/bookings/${id}/qr/base64`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Verify booking (innovation)
  verifyBooking: async (token, id) => {
    const response = await apiClient.get(`/api/bookings/${id}/verify`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Get analytics (Admin - innovation)
  getAnalytics: async (token) => {
    const response = await apiClient.get('/api/bookings/analytics', {
      headers: getAuthHeader(token)
    });
    return response.data;
  }
};

export default bookingService;