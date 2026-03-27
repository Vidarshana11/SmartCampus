/**
 * Member 4: Role Management Page
 * Admin page for managing user roles
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import * as roleService from '../services/roleService'
import './RoleManagement.css'

const ROLES = [
  { value: 'STUDENT', label: 'Student', description: 'Regular student user' },
  { value: 'LECTURER', label: 'Lecturer', description: 'Can make bookings' },
  { value: 'TECHNICIAN', label: 'Technician', description: 'Handles maintenance tickets' },
  { value: 'MANAGER', label: 'Manager', description: 'Can approve bookings' },
  { value: 'ADMIN', label: 'Admin', description: 'Full system access' },
]

export default function RoleManagement() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [editingUser, setEditingUser] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await roleService.getUsers(token, {
        page,
        search,
        role: selectedRole || undefined,
      })
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, search, selectedRole])

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await roleService.updateUserRole(token, userId, newRole)
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      )
      setEditingUser(null)
      setSuccessMessage('Role updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await roleService.deleteUser(token, userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setSuccessMessage('User deleted successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'role-badge-admin'
      case 'MANAGER':
        return 'role-badge-manager'
      case 'TECHNICIAN':
        return 'role-badge-technician'
      case 'LECTURER':
        return 'role-badge-lecturer'
      default:
        return 'role-badge-student'
    }
  }

  return (
    <div className="role-management-container">
      <header className="role-management-header">
        <h1>Role Management</h1>
        <p>Manage user roles and permissions</p>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="search-input"
        />

        <select
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value)
            setPage(0)
          }}
          className="role-filter"
        >
          <option value="">All Roles</option>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <div className="users-table-container">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users found</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      {user.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt={user.name}
                          className="user-avatar"
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span>{user.name}</span>
                      {user.id === currentUser?.id && (
                        <span className="current-user-badge">You</span>
                      )}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {editingUser === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="role-select"
                        autoFocus
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`role-badge ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                        className="btn-edit"
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? 'Cannot edit own role' : 'Edit role'}
                      >
                        {editingUser === user.id ? 'Cancel' : 'Edit Role'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn-delete"
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? 'Cannot delete own account' : 'Delete user'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
