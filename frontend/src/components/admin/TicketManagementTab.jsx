import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import ticketService from '../../services/ticketService'
import DataTable from './DataTable'
import StatusBadge from '../tickets/StatusBadge'
import { FaSync, FaExclamationCircle } from 'react-icons/fa'

const CATEGORIES = {
  ELECTRICAL: '⚡ Electrical',
  PLUMBING: '🔧 Plumbing',
  HVAC: '❄️ HVAC',
  CLEANING: '🧹 Cleaning',
  IT_SUPPORT: '💻 IT Support',
  FURNITURE: '🪑 Furniture',
  SECURITY: '🔒 Security',
  OTHER: '📋 Other'
}

export default function TicketManagementTab({ onSelectTicket }) {
  const { token } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchTickets = useCallback(
    async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await ticketService.getTickets(token)
        setTickets(data)
      } catch (err) {
        console.error('Failed to fetch tickets:', err)
        setError('Failed to load tickets. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filteredTickets = tickets.filter(ticket => {
    const description = ticket.description || ''
    const resourceName = ticket.resourceName || ''
    const createdByName = ticket.createdByName || ''

    const matchesSearch = 
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      createdByName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || ticket.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      render: (id) => <span className="text-gray-500 font-mono">#{String(id).padStart(4, '0')}</span>
    },
    {
      key: 'description',
      label: 'Issue description',
      render: (desc) => <span className="font-medium line-clamp-1">{desc}</span>
    },
    {
      key: 'resourceName',
      label: 'Resource',
      render: (name) => <span className="text-gray-600 italic">{name || 'Unknown Resource'}</span>
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (priority) => {
        const colors = {
          HIGH: 'text-red-600 font-bold',
          MEDIUM: 'text-yellow-600 font-bold',
          LOW: 'text-blue-600 font-bold'
        }
        return <span className={colors[priority] || ''}>{priority}</span>
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />
    },
    {
      key: 'createdByName',
      label: 'Reported by',
      render: (name) => name || 'Unknown User'
    },
    {
      key: 'createdAt',
      label: 'Reported on',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ]

  const actions = (ticket) => [
    {
      label: 'Update',
      variant: 'edit',
      onClick: () => onSelectTicket(ticket.id)
    }
  ]

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center gap-2">
          <FaExclamationCircle />
          {error}
        </div>
      )}

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredTickets.length} of {tickets.length} total tickets
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTickets}
        loading={loading}
        onSearch={setSearchTerm}
        onFilter={setStatusFilter}
        filterLabel="Status"
        filterOptions={[
          { value: 'OPEN', label: 'Open' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'RESOLVED', label: 'Resolved' },
          { value: 'CLOSED', label: 'Closed' },
          { value: 'REJECTED', label: 'Rejected' }
        ]}
        actions={actions}
        searchPlaceholder="Search by description, resource, or user..."
        emptyMessage="No tickets found"
      />
    </div>
  )
}
