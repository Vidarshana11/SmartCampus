import apiClient from '../api/apiClient'

const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const resourceService = {
  // Get all resources with optional filters
  getAllResources: async (token, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.capacity) params.append('capacity', filters.capacity);
    if (filters.location) params.append('location', filters.location);
    
    // Convert to object for axios params
    const paramsObj = {};
    for(let [key, value] of params.entries()) {
      paramsObj[key] = value;
    }
    
    const response = await apiClient.get('/api/resources', { 
      params: paramsObj,
      headers: getAuthHeader(token) 
    });
    return response.data;
  },

  // Get a single resource
  getResourceById: async (token, id) => {
    const response = await apiClient.get(`/api/resources/${id}`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Create a new resource (Admin only)
  createResource: async (token, resourceData) => {
    const response = await apiClient.post('/api/resources', resourceData, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Update a resource (Admin only)
  updateResource: async (token, id, resourceData) => {
    const response = await apiClient.put(`/api/resources/${id}`, resourceData, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  // Delete a resource (Admin only)
  deleteResource: async (token, id) => {
    const response = await apiClient.delete(`/api/resources/${id}`, {
      headers: getAuthHeader(token)
    });
    return response.data;
  }
};

export default resourceService;
