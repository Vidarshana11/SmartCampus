import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { getAdminUsers, editAdminUser, changeAdminUserRole, deleteAdminUser, createAdminUser, createAdminAccount } from '../../services/adminService'
import DataTable from './DataTable'
import ConfirmDialog from './ConfirmDialog'
import StatusBadge from './StatusBadge'
import { FaPlus, FaSpinner } from 'react-icons/fa'

const ROLE_COLORS = {
  STUDENT: '#3B82F6',
  LECTURER: '#8B5CF6',
  TECHNICIAN: '#10B981',
  MANAGER: '#F59E0B',
  ADMIN: '#EF4444',
  USER: '#6B7280',
}

export default function UserManagementTab({ token }) {
  const { user: loggedInUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // Modals
  const [editingUserId, setEditingUserId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  // Create user modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' })

  // Create admin modal
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false)
  const [createAdminForm, setCreateAdminForm] = useState({ name: '', email: '', password: '' })

  // Fetch users - excluding logged-in user
  const fetchUsers = useCallback(
    async (currentPage = 0) => {
      try {
        setLoading(true)
        setError(null)

        const result = await getAdminUsers(token, {
          page: currentPage,
          size: pageSize,
          search: searchTerm,
          role: selectedRole || null,
        })

        // Filter out the logged-in user
        const filteredUsers = result.content?.filter((u) => u.id !== loggedInUser?.id) || []

        setUsers(filteredUsers)
        setTotalElements(result.totalElements || 0)
        setPage(currentPage)
      } catch (err) {
        console.error('Failed to fetch users:', err)
        setError('Failed to load users. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [token, pageSize, searchTerm, selectedRole, loggedInUser?.id]
  )

  // Load users on mount or filter change
  useEffect(() => {
    fetchUsers(0)
  }, [searchTerm, selectedRole, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (term) => {
    setSearchTerm(term)
    setPage(0)
  }

  const handleFilterRole = (role) => {
    setSelectedRole(role)
    setPage(0)
  }

  // Create regular user
  const handleCreateUser = async () => {
    if (!createUserForm.name.trim() || !createUserForm.email.trim() || !createUserForm.password.trim()) {
      setError('All fields are required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await createAdminUser(token, {
        name: createUserForm.name,
        email: createUserForm.email,
        password: createUserForm.password,
        role: createUserForm.role,
      })

      setSuccess('User created successfully')
      setShowCreateUserModal(false)
      setCreateUserForm({ name: '', email: '', password: '', role: 'STUDENT' })
      await fetchUsers(0)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to create user:', err)
      setError(err.response?.data?.error || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  // Create admin user
  const handleCreateAdmin = async () => {
    if (!createAdminForm.name.trim() || !createAdminForm.email.trim() || !createAdminForm.password.trim()) {
      setError('All fields are required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await createAdminAccount(token, {
        name: createAdminForm.name,
        email: createAdminForm.email,
        password: createAdminForm.password,
      })

      setSuccess('Admin created successfully')
      setShowCreateAdminModal(false)
      setCreateAdminForm({ name: '', email: '', password: '' })
      await fetchUsers(0)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to create admin:', err)
      setError(err.response?.data?.error || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  // Edit user - only role editing
  const handleEditOpen = (user) => {
    setEditingUserId(user.id)
    setEditRole(user.role)
    setError(null)
    setSuccess(null)
  }

  const handleEditSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await changeAdminUserRole(token, editingUserId, editRole)

      setSuccess('User role updated successfully')
      setEditingUserId(null)
      await fetchUsers(page)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to edit user:', err)
      setError(err.response?.data?.error || 'Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const handleDeleteOpen = (user) => {
    setDeleteConfirmId(user.id)
    setDeleteConfirmName(user.name)
    setError(null)
    setSuccess(null)
  }

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await deleteAdminUser(token, deleteConfirmId)

      setSuccess('User deleted successfully')
      setDeleteConfirmId(null)
      await fetchUsers(page)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError(err.response?.data?.error || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-yellow-300 flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {value.charAt(0).toUpperCase()}
          </div>
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => (value ? new Date(value).toLocaleDateString() : '--'),
    },
  ]

  // Table actions - disable edit for admins
  const getActions = (user) => {
    if (user.role === 'ADMIN') {
      return [
        {
          label: 'Delete',
          variant: 'delete',
          onClick: () => handleDeleteOpen(user),
        },
      ]
    }
    return [
      {
        label: 'Edit',
        variant: 'edit',
        onClick: () => handleEditOpen(user),
      },
      {
        label: 'Delete',
        variant: 'delete',
        onClick: () => handleDeleteOpen(user),
      },
    ]
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium animate-slideDown flex items-center gap-2">
          <span>✓</span>
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium animate-slideDown flex items-center gap-2">
          <span>✕</span>
          {error}
        </div>
      )}

      {/* Create User & Admin Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowCreateUserModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaPlus className="w-4 h-4" />
          Add User
        </button>
        <button
          onClick={() => setShowCreateAdminModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <FaPlus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn" onClick={() => { setShowCreateUserModal(false); setError(null); }}>
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-[90%] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer text-gray-900"
                >
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                onClick={() => { setShowCreateUserModal(false); setError(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                onClick={handleCreateUser}
                disabled={loading}
              >
                {loading && <FaSpinner className="animate-spin w-4 h-4" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn" onClick={() => { setShowCreateAdminModal(false); setError(null); }}>
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-[90%] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Admin</h3>
              <p className="text-xs text-gray-500 mt-1">New admin accounts will have full system access</p>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={createAdminForm.name}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={createAdminForm.email}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={createAdminForm.password}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                onClick={() => { setShowCreateAdminModal(false); setError(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                onClick={handleCreateAdmin}
                disabled={loading}
              >
                {loading && <FaSpinner className="animate-spin w-4 h-4" />}
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn" onClick={() => { setEditingUserId(null); setError(null); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-[90%] overflow-hidden animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer text-gray-900"
                >
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => { setEditingUserId(null); setError(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleEditSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete User?"
        message={`Are you sure you want to delete ${deleteConfirmName}? This action cannot be undone.`}
        confirmText="Delete"
        isDangerous={true}
        isLoading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        pagination={{
          current: page,
          size: pageSize,
          total: totalElements,
        }}
        onPageChange={(newPage) => fetchUsers(newPage)}
        onSearch={handleSearch}
        onFilter={handleFilterRole}
        filterOptions={[
          { value: 'STUDENT', label: 'Student' },
          { value: 'LECTURER', label: 'Lecturer' },
          { value: 'TECHNICIAN', label: 'Technician' },
          { value: 'MANAGER', label: 'Manager' },
          { value: 'ADMIN', label: 'Admin' },
        ]}
        filterLabel="Role"
        actions={(user) => getActions(user)}
        searchPlaceholder="Search by name or email..."
        emptyMessage="No users found"
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }
      `}</style>
    </div>
  )
}
