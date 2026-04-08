import { useState, useCallback, useEffect } from 'react'
import resourceService from '../../services/resourceService'
import DataTable from './DataTable'
import ConfirmDialog from './ConfirmDialog'
import StatusBadge from './StatusBadge'
import ResourceForm from './ResourceForm'
import './AdminComponents.css'
import { FaPlus } from 'react-icons/fa'

const RESOURCE_TYPES = ['ROOM', 'LAB', 'EQUIPMENT']

export default function ResourceManagementTab({ token }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Filtering
  const [selectedType, setSelectedType] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Form handling
  const [showForm, setShowForm] = useState(false)
  const [editingResourceId, setEditingResourceId] = useState(null)

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  // Fetch resources
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await resourceService.getAllResources(token, {
        type: selectedType || undefined
      })
      
      // Simple frontend search since backend API doesn't handle name search natively right now
      const filtered = searchTerm 
        ? data.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.location.toLowerCase().includes(searchTerm.toLowerCase()))
        : data;
        
      setResources(filtered)
    } catch (err) {
      console.error('Failed to fetch resources:', err)
      setError('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedType, token])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // Delete resource
  const handleDeleteConfirm = async () => {
    try {
      setLoading(true)
      await resourceService.deleteResource(token, deleteConfirmId)
      setSuccess('Resource deleted successfully')
      setDeleteConfirmId(null)
      await fetchResources()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to delete resource')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setSuccess(editingResourceId ? 'Resource updated successfully' : 'Resource created successfully')
    setShowForm(false)
    setEditingResourceId(null)
    fetchResources()
    setTimeout(() => setSuccess(null), 3000)
  }

  const columns = [
    { key: 'id', label: 'ID', width: '60px', render: (v) => `#${v}` },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'location', label: 'Location' },
    { key: 'capacity', label: 'Capacity', render: (v) => `${v} people` },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ]

  const actions = [
    {
      label: 'Edit',
      variant: 'primary',
      onClick: (resource) => {
        setEditingResourceId(resource.id)
        setShowForm(true)
      },
    },
    {
      label: 'Delete',
      variant: 'delete',
      onClick: (resource) => {
        setDeleteConfirmId(resource.id)
        setDeleteConfirmName(resource.name)
      },
    },
  ]

  if (showForm) {
    return (
      <div className="flex justify-center mt-6">
        <ResourceForm 
          token={token}
          resourceId={editingResourceId} 
          onSuccess={handleFormSuccess} 
          onCancel={() => { setShowForm(false); setEditingResourceId(null); }} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="success-message animate-slideDown">
          {success}
        </div>
      )}
      {error && (
        <div className="error-message animate-slideDown">
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#003366]">Resources</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#003366] text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-[#002244] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <FaPlus /> Add New Resource
        </button>
      </div>

      <DataTable
        columns={columns}
        data={resources}
        loading={loading}
        error={error}
        onSearch={(term) => setSearchTerm(term)}
        onFilter={(val) => setSelectedType(val)}
        filterOptions={RESOURCE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
        filterLabel="Type"
        actions={actions}
        searchPlaceholder="Search by name or location..."
        emptyMessage="No resources found"
        filterClassName="text-black bg-white"
        searchClassName="text-black bg-white"
      />

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideDown { animation: slideDown 0.3s ease; }
      `}</style>
    </div>
  )
}
