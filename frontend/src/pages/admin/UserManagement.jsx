import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import '../../styles/admin/UserManagement.css'

export default function UserManagement() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'STUDENT', createdAt: '2024-01-15', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'LECTURER', createdAt: '2024-01-20', status: 'Active' },
    { id: 3, name: 'Tech Support', email: 'support@example.com', role: 'TECHNICIAN', createdAt: '2024-02-01', status: 'Active' },
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const filteredUsers = users.filter((user) => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = !filterRole || user.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div className="user-management-container">
      <div className="management-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="LECTURER">Lecturer</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button className="btn-create">+ Create User</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge badge-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.createdAt}</td>
                <td>
                  <span className={`status ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td className="actions">
                  <button className="btn-sm btn-edit">Edit</button>
                  <button className="btn-sm btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <p>No users found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
