import apiClient from '../api/apiClient'

const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ticketService = {
  // Get tickets (filtered by role on backend)
  getTickets: async (token) => {
    const response = await apiClient.get('/api/tickets', {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Get single ticket
  getTicketById: async (token, id) => {
    const response = await apiClient.get(`/api/tickets/${id}`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Create ticket with file uploads
  createTicket: async (token, ticketData, files) => {
    const formData = new FormData();
    formData.append('ticket', new Blob([JSON.stringify(ticketData)], { type: 'application/json' }));
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    const response = await apiClient.post('/api/tickets', formData, {
      headers: {
        ...getAuthHeader(token),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update ticket status
  updateStatus: async (token, ticketId, status, rejectionReason, resolutionNotes) => {
    const response = await apiClient.put(`/api/tickets/${ticketId}/status`, {
      status,
      rejectionReason: rejectionReason || null,
      resolutionNotes: resolutionNotes || null
    }, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Assign technician
  assignTechnician: async (token, ticketId, technicianId) => {
    const response = await apiClient.put(`/api/tickets/${ticketId}/assign`, {
      technicianId
    }, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Get technicians list (admin only)
  getTechnicians: async (token) => {
    const response = await apiClient.get('/api/tickets/technicians', {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Get comments for a ticket
  getComments: async (token, ticketId) => {
    const response = await apiClient.get(`/api/tickets/${ticketId}/comments`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Add a comment
  addComment: async (token, ticketId, content) => {
    const response = await apiClient.post(`/api/tickets/${ticketId}/comments`, {
      content
    }, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Edit a comment
  editComment: async (token, commentId, content) => {
    const response = await apiClient.put(`/api/tickets/comments/${commentId}`, {
      content
    }, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Delete a comment
  deleteComment: async (token, commentId) => {
    const response = await apiClient.delete(`/api/tickets/comments/${commentId}`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  }
};

export default ticketService;
