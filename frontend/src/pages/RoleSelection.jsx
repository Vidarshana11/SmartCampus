import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { updateUserRole } from '../services/roleService'
import { FaGraduationCap, FaBook, FaTools, FaSpinner } from 'react-icons/fa'
import '../styles/RoleSelection.css'

const ROLE_OPTIONS = [
  {
    id: 'STUDENT',
    label: 'Student',
    description: 'I am a student enrolled in courses',
    icon: FaGraduationCap,
  },
  {
    id: 'LECTURER',
    label: 'Lecturer',
    description: 'I am an instructor or lecturer',
    icon: FaBook,
  },
  {
    id: 'TECHNICIAN',
    label: 'Technician',
    description: 'I am a technician or support staff',
    icon: FaTools,
  },
]

export default function RoleSelection() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, loading: authLoading } = useAuth()
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  usePageTitle('Select Your Role')

  // Extract token from URL params in case it's not in auth context yet
  const urlToken = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('token')
  }, [location.search])

  const authToken = token || urlToken

  // Wait for user data to load
  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      console.error('User not found, redirecting to login')
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Clear error when role is selected
  const handleRoleChange = (role) => {
    setSelectedRole(role)
    setError('') // Clear error when user selects a role
  }

  // Handle role selection
  const handleSelectRole = async () => {
    if (!selectedRole) {
      setError('Please select a role')
      return
    }

    if (!user?.id) {
      setError('User information not found')
      return
    }

    if (!authToken) {
      setError('Authentication token missing')
      return
    }

    try {
      setLoading(true)
      setError('')

      console.log('Updating role for user:', user.id, 'to:', selectedRole)

      // Update user role
      await updateUserRole(authToken, user.id, selectedRole)

      console.log('Role updated successfully')

      // Redirect to dashboard on success
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Failed to update role:', err)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to set role. Please try again.'
      setError(errorMsg)
      setLoading(false)
    }
  }

  // Show loading while user data is being fetched
  if (authLoading) {
    return (
      <div className="role-selection-container">
        <div className="role-selection-card">
          <div className="flex items-center justify-center gap-3">
            <FaSpinner className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-gray-700 font-medium">Loading your account...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="role-selection-container">
      <div className="role-selection-card">
        <div className="role-selection-header">
          <h1>Select Your Role</h1>
          <p>Choose the role that best describes you</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="role-options">
          {ROLE_OPTIONS.map((option) => {
            const IconComponent = option.icon
            return (
              <label key={option.id} className="role-option">
                <input
                  type="radio"
                  name="role"
                  value={option.id}
                  checked={selectedRole === option.id}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={loading}
                />
                <div className="role-option-content">
                  <div className="role-option-icon">
                    <IconComponent />
                  </div>
                  <div className="role-option-text">
                    <div className="role-label">{option.label}</div>
                    <div className="role-description">{option.description}</div>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <button
          className="btn-role-select"
          onClick={handleSelectRole}
          disabled={!selectedRole || loading}
        >
          {loading ? 'Setting up your account...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
