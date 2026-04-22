import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import ticketService from '../../services/ticketService'
import { getAdminUsers } from '../../services/adminService'
import StatusBadge from '../tickets/StatusBadge'
import CommentSection from '../tickets/CommentSection'
import { FaArrowLeft, FaSave, FaUserShield, FaTools, FaInfoCircle, FaExclamationTriangle, FaTicketAlt, FaImage } from 'react-icons/fa'
import { getImageUrl } from '../../api/apiClient'

export default function TicketUpdateTab({ ticketId, onBack }) {
  const { token } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Form State
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [ticketData, techData] = await Promise.all([
        ticketService.getTicketById(token, ticketId),
        getAdminUsers(token, { role: 'TECHNICIAN', size: 100 })
      ])
      
      setTicket(ticketData)
      setTechnicians(techData.content || [])
      
      // Initialize form
      setStatus(ticketData.status)
      setPriority(ticketData.priority)
      setAssignedToId(ticketData.assignedToId || '')
      setRejectionReason(ticketData.rejectionReason || '')
      setResolutionNotes(ticketData.resolutionNotes || '')
    } catch (err) {
      console.error('Failed to fetch ticket details:', err)
      setError('Failed to load ticket details.')
    } finally {
      setLoading(false)
    }
  }, [ticketId, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateStatus = async () => {
    const trimmedRejectionReason = rejectionReason.trim()
    const trimmedResolutionNotes = resolutionNotes.trim()

    if (status === 'REJECTED' && !trimmedRejectionReason) {
      setError('Rejection reason is required')
      return
    }

    try {
      setUpdating(true)
      setError(null)
      await ticketService.updateStatus(
        token,
        ticketId,
        status,
        status === 'REJECTED' ? trimmedRejectionReason : null,
        status === 'RESOLVED' ? trimmedResolutionNotes : null
      )
      setSuccess('Status updated successfully')
      setTimeout(() => setSuccess(null), 3000)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async () => {
    try {
      setUpdating(true)
      setError(null)
      await ticketService.assignTechnician(token, ticketId, assignedToId)
      setSuccess('Technician assigned successfully')
      setTimeout(() => setSuccess(null), 3000)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign technician')
    } finally {
      setUpdating(false)
    }
  }

  if (!ticketId) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300 animate-fadeIn">
        <FaTicketAlt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Ticket Selected</h3>
        <p className="text-gray-500 mb-6">Please select a ticket from the Tickets list to view or update its details.</p>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md"
        >
          Go to Tickets List
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        Loading ticket details...
      </div>
    )
  }

  if (!ticket) return <div className="p-8 text-center text-gray-500">Ticket not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <FaArrowLeft />
          Back to list
        </button>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-mono text-sm">#TKT-{String(ticket.id).padStart(4, '0')}</span>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium flex items-center gap-2 animate-slideDown">
          <span>✓</span> {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center gap-2 animate-slideDown">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Update Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                Ticket Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <p className="text-gray-900 font-medium leading-relaxed">{ticket.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Resource</label>
                  <p className="text-gray-900">{ticket.resourceName}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                  <p className="text-gray-900">{ticket.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reported By</label>
                  <p className="text-gray-900">{ticket.createdByName}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact</label>
                  <p className="text-gray-900">{ticket.contactDetails || 'No contact provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaTools className="text-blue-600" />
                Management Actions
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Update Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-white"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Current Priority: {ticket.priority}</label>
                  <div className="flex gap-2">
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          priority === p 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conditional Fields */}
              {status === 'REJECTED' && (
                <div className="space-y-2 animate-slideDown">
                  <label className="block text-sm font-semibold text-gray-700">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter why this ticket is being rejected..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black h-24"
                  />
                </div>
              )}

              {status === 'RESOLVED' && (
                <div className="space-y-2 animate-slideDown">
                  <label className="block text-sm font-semibold text-gray-700">Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black h-24"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md disabled:opacity-50"
                >
                  <FaSave />
                  {updating ? 'Updating...' : 'Save Status & Notes'}
                </button>
              </div>

              <hr className="border-gray-100" />

              {/* Assignment Section */}
              <div className="space-y-4">
                <h4 className="text-md font-bold text-gray-900 flex items-center gap-2">
                  <FaUserShield className="text-blue-600" />
                  Technician Assignment
                </h4>
                <div className="flex gap-3">
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-white"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name} ({tech.email})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={updating}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-bold shadow-md disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attachments & Comments */}
        <div className="space-y-6">
          {/* Attachments */}
          {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-900 flex items-center gap-2">
                <FaImage className="text-blue-600" />
                Attachments ({ticket.attachmentUrls.length})
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {ticket.attachmentUrls.map((url, i) => (
                  <a 
                    key={i} 
                    href={getImageUrl(url)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block group relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden hover:border-blue-500 transition-all"
                  >
                    <img
                      src={getImageUrl(url)}
                      alt={`Attachment ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                      <FaImage className="text-white opacity-0 group-hover:opacity-100 w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comment Section (Directly integrated) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-900">Discussion</div>
            <div className="p-4">
              <CommentSection ticketId={ticketId} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  )
}
