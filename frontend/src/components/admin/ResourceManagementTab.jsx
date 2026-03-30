import { useState, useCallback } from 'react'
import { getAdminResources, createAdminResource, updateAdminResource, deleteAdminResource } from '../../services/adminService'
import DataTable from './DataTable'
import ConfirmDialog from './ConfirmDialog'
import StatusBadge from './StatusBadge'
import { FaSpinner } from 'react-icons/fa'

const RESOURCE_TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'STUDY_ROOM', 'EQUIPMENT']

export default function ResourceManagementTab({ token }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Filtering
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  // Fetch resources
  const fetchResources = useCallback(
    async (currentPage = 0) => {
      try {
        setLoading(true)
        setError(null)

        const result = await getAdminResources(token, {
          page: currentPage,
          size: pageSize,
          search: searchTerm,
          type: selectedType || null,
          status: selectedStatus || null,
        })

        setResources(result.content || [])
        setTotalElements(result.totalElements || 0)
        setPage(currentPage)
      } catch (err) {
        console.error('Failed to fetch resources:', err)
        setError('Failed to load resources')
      } finally {
        setLoading(false)
      }
    },
    [token, pageSize, searchTerm, selectedType, selectedStatus]
  )

  // Delete resource
  const handleDeleteConfirm = async () => {
    try {
      setLoading(true)
      await deleteAdminResource(token, deleteConfirmId)
      setSuccess('Resource deleted successfully')
      setDeleteConfirmId(null)
      await fetchResources(page)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to delete resource')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'id', label: 'ID', width: '60px', render: (v) => `#${v}` },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (v) => v.replace(/_/g, ' ') },
    { key: 'location', label: 'Location' },
    { key: 'capacity', label: 'Capacity', render: (v) => `${v} people` },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ]

  const actions = [
    {
      label: 'Delete',
      variant: 'delete',
      onClick: (resource) => {
        setDeleteConfirmId(resource.id)
        setDeleteConfirmName(resource.name)
      },
    },
  ]

  return (
    <div className="space-y-4">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium animate-slideDown">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium animate-slideDown">
          {error}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Resource?"
        message={`Are you sure you want to delete ${deleteConfirmName}?`}
        confirmText="Delete"
        isDangerous={true}
        isLoading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <DataTable
        columns={columns}
        data={resources}
        loading={loading}
        error={error}
        pagination={{ current: page, size: pageSize, total: totalElements }}
        onPageChange={(newPage) => fetchResources(newPage)}
        onSearch={(term) => {
          setSearchTerm(term)
          setPage(0)
        }}
        onFilter={(val) => {
          setSelectedType(val)
          setPage(0)
        }}
        filterOptions={RESOURCE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
        filterLabel="Type"
        actions={actions}
        searchPlaceholder="Search by name..."
        emptyMessage="No resources found"
      />

      <style>{`
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
        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }
      `}</style>
    </div>
  )
}
