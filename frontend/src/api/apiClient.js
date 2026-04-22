import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

// Central API client so auth headers can be attached per-request.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper function to get full image URL
export const getImageUrl = (relativePath) => {
  if (!relativePath) return null
  // If it's already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}/${relativePath}`
}

export default apiClient


