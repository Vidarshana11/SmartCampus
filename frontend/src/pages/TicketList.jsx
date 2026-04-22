import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import ticketService from '../services/ticketService'
import StatusBadge from '../components/tickets/StatusBadge'
import {
  FaPlus, FaTicketAlt, FaClock, FaUser, FaMapMarkerAlt,
  FaFilter, FaExclamationCircle, FaSpinner
} from 'react-icons/fa'

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

const PRIORITY_STYLES = {
  HIGH: { border: 'border-l-red-500', badge: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
  MEDIUM: { border: 'border-l-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500' },
  LOW: { border: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' }
}

export default function TicketList({ hideHeader = false }) {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await ticketService.getTickets(token)
      setTickets(data)
    } catch (err) {
      setError('Failed to load tickets')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filteredTickets = tickets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className={`min-h-screen ${hideHeader ? '' : 'bg-gray-50'}`}>
      {/* Header */}
      {!hideHeader && (
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaTicketAlt className="text-blue-600" />
                Incident Tickets
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === 'ADMIN' || user?.role === 'MANAGER'
                  ? 'Manage and oversee all incident reports'
                  : user?.role === 'TECHNICIAN'
                    ? 'View your assigned tickets and incidents you reported'
                    : 'Track your reported incidents'}
              </p>
            </div>
            <button
              onClick={() => navigate('/tickets/create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <FaPlus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Filters Bar */}
      <div className={`bg-white border-b border-gray-200 shadow-sm ${hideHeader ? 'sticky top-0 z-20' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <FaFilter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-black bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-black bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            {hideHeader && (
              <button
                onClick={() => navigate('/tickets/create')}
                className="ml-auto inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <FaPlus className="w-3.5 h-3.5" />
                New Ticket
              </button>
            )}

            <span className={`text-sm text-gray-500 ${hideHeader ? 'ml-0' : 'ml-auto'}`}>
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${hideHeader ? 'py-6' : 'max-w-7xl mx-auto px-6 py-8'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <FaSpinner className="w-5 h-5 animate-spin" />
            Loading tickets...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
            {error}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <FaExclamationCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No tickets found</h3>
            <p className="text-gray-500 text-sm">
              {statusFilter || priorityFilter
                ? 'Try adjusting your filters.'
                : 'Create your first incident ticket to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTickets.map(ticket => {
              const pStyle = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.LOW
              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${pStyle.border}`}
                >
                  <div className="p-5">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        #TKT-{String(ticket.id).padStart(4, '0')}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>

                    {/* Description */}
                    <p className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>

                    {/* Tags Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${pStyle.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot} mr-1.5`}></span>
                        {ticket.priority}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {CATEGORIES[ticket.category] || ticket.category}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col gap-1.5 text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        <span>{ticket.resourceName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FaUser className="w-3 h-3" />
                          <span>{ticket.createdByName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaClock className="w-3 h-3" />
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
