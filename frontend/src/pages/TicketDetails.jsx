import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import ticketService from '../services/ticketService'
import StatusBadge from '../components/tickets/StatusBadge'
import CommentSection from '../components/tickets/CommentSection'
import { getImageUrl } from '../api/apiClient'
import {
  FaArrowLeft, FaTicketAlt, FaMapMarkerAlt, FaUser,
  FaClock, FaPhone, FaImage, FaComments, FaInfoCircle, FaWrench, FaUserCog,
  FaSpinner, FaTimes, FaCheck
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

const getNextStatuses = (currentStatus, role) => {
  if (role === 'ADMIN' || role === 'MANAGER') {
    switch (currentStatus) {
      case 'OPEN': return ['IN_PROGRESS', 'REJECTED']
      case 'IN_PROGRESS': return ['RESOLVED', 'REJECTED']
      case 'RESOLVED': return ['CLOSED']
      default: return []
    }
  }
  if (role === 'TECHNICIAN') {
    switch (currentStatus) {
      case 'OPEN': return ['IN_PROGRESS']
      case 'IN_PROGRESS': return ['RESOLVED']
      default: return []
    }
  }
  return []
}

export default function TicketDetails() {
  const { id } = useParams()
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusUpdating, setStatusUpdating] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)

  const [technicians, setTechnicians] = useState([])
  const [selectedTech, setSelectedTech] = useState('')
  const [assigning, setAssigning] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    fetchTicket()
    if (isAdmin) fetchTechnicians()
  }, [id, token])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const data = await ticketService.getTicketById(token, id)
      setTicket(data)
    } catch (err) {
      setError('Failed to load ticket')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const data = await ticketService.getTechnicians(token)
      setTechnicians(data)
    } catch (err) {
      console.error('Failed to fetch technicians:', err)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'REJECTED') {
      setShowRejectModal(true)
      return
    }
    if (newStatus === 'RESOLVED') {
      setShowResolveModal(true)
      return
    }
    try {
      setStatusUpdating(true)
      const updated = await ticketService.updateStatus(token, ticket.id, newStatus)
      setTicket(updated)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required')
      return
    }
    try {
      setStatusUpdating(true)
      const updated = await ticketService.updateStatus(token, ticket.id, 'REJECTED', rejectionReason.trim())
      setTicket(updated)
      setShowRejectModal(false)
      setRejectionReason('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject ticket')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleResolve = async () => {
    try {
      setStatusUpdating(true)
      const updated = await ticketService.updateStatus(token, ticket.id, 'RESOLVED', null, resolutionNotes.trim())
      setTicket(updated)
      setShowResolveModal(false)
      setResolutionNotes('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve ticket')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedTech) return
    try {
      setAssigning(true)
      const updated = await ticketService.assignTechnician(token, ticket.id, Number(selectedTech))
      setTicket(updated)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign technician')
    } finally {
      setAssigning(false)
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-center">
          {error || 'Ticket not found'}
        </div>
      </div>
    )
  }

  const nextStatuses = getNextStatuses(ticket.status, user?.role)

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/tickets')}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                title="Back to Tickets"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    #TKT-{String(ticket.id).padStart(4, '0')}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    ticket.priority === 'HIGH' ? 'bg-red-50 text-red-700' :
                    ticket.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {ticket.priority} Priority
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">
                  {CATEGORIES[ticket.category] || ticket.category}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FaInfoCircle className="text-blue-600" />
                  Issue Description
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Resolution/Rejection Notifications */}
            {ticket.rejectionReason && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <FaTimes /> Rejection Reason
                </h3>
                <p className="text-red-700 text-sm">{ticket.rejectionReason}</p>
              </div>
            )}

            {ticket.resolutionNotes && (
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <FaCheck /> Resolution Notes
                </h3>
                <p className="text-emerald-700 text-sm">{ticket.resolutionNotes}</p>
              </div>
            )}

            {/* Attachments Card */}
            {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FaImage className="text-blue-600" />
                    Attachments ({ticket.attachmentUrls.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-4">
                    {ticket.attachmentUrls.map((url, i) => (
                      <a 
                        key={i} 
                        href={getImageUrl(url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative w-32 h-32 rounded-lg border border-gray-200 overflow-hidden hover:border-blue-500 transition-all"
                      >
                        <img 
                          src={getImageUrl(url)} 
                          alt={`Attachment ${i + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                          <FaImage className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FaComments className="text-blue-600" />
                  Activity & Comments
                </h3>
              </div>
              <div className="p-6">
                <CommentSection ticketId={ticket.id} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info Sidebar Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Ticket Info</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.resourceName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaUser className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporter</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.createdByName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaClock className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported On</p>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(ticket.createdAt)}</p>
                  </div>
                </div>
                {ticket.contactDetails && (
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</p>
                      <p className="text-sm font-medium text-gray-900">{ticket.contactDetails}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FaWrench className="text-blue-600" />
                  Technician
                </h3>
              </div>
              <div className="p-6">
                {ticket.assignedToName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                      {ticket.assignedToName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{ticket.assignedToName}</p>
                      <p className="text-xs text-gray-500">Assigned Technician</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No technician assigned yet.</p>
                )}

                {isAdmin && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Assign to Technician
                    </label>
                    <select 
                      value={selectedTech} 
                      onChange={e => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select technician...</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleAssign} 
                      disabled={!selectedTech || assigning}
                      className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {assigning ? 'Assigning...' : 'Assign Technician'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status Actions Sidebar Card */}
            {nextStatuses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FaUserCog className="text-blue-600" />
                    Manage Status
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  {nextStatuses.map(status => (
                    <button 
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={statusUpdating}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                        status === 'REJECTED' 
                          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {statusUpdating ? 'Updating...' : `Set to ${status.replace('_', ' ')}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals - using AdminPanel's styled modal approach */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-red-700">Reject Ticket</h2>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-900">
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this report. This will be visible to the reporter.</p>
              <textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-black h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReject}
                  disabled={statusUpdating || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-emerald-700">Resolve Ticket</h2>
              <button onClick={() => setShowResolveModal(false)} className="text-gray-400 hover:text-gray-900">
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Add the resolution details describing the fix or action taken.</p>
              <textarea
                placeholder="Resolution notes (optional)..."
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-black h-32 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResolve}
                  disabled={statusUpdating}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
