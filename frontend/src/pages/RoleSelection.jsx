import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { updateUserRole } from '../services/roleService'
import { FaGraduationCap, FaBook, FaTools } from 'react-icons/fa'
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
  const { user, token } = useAuth()
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

    try {
      setLoading(true)
      setError('')

      // Update user role
      await updateUserRole(authToken, user.id, selectedRole)

      // Redirect to dashboard on success
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set role. Please try again.')
      setLoading(false)
    }
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
                  onChange={(e) => setSelectedRole(e.target.value)}
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
