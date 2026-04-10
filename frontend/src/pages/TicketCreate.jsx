import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import ticketService from '../services/ticketService'
import resourceService from '../services/resourceService'
import ImageUploader from '../components/tickets/ImageUploader'
import { FaArrowLeft, FaTicketAlt, FaSpinner } from 'react-icons/fa'

export default function TicketCreate() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [resources, setResources] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    resourceId: '',
    category: '',
    description: '',
    priority: '',
    contactDetails: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await resourceService.getAllResources(token)
        setResources(data)
      } catch (err) {
        console.error('Failed to fetch resources:', err)
      }
    }
    fetchResources()
  }, [token])

  const validate = () => {
    const newErrors = {}
    if (!form.resourceId) newErrors.resourceId = 'Resource is required'
    if (!form.category) newErrors.category = 'Category is required'
    if (!form.description.trim()) newErrors.description = 'Description is required'
    if (!form.priority) newErrors.priority = 'Priority is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setLoading(true)
      setError('')
      const ticketData = {
        resourceId: Number(form.resourceId),
        category: form.category,
        description: form.description.trim(),
        priority: form.priority,
        contactDetails: form.contactDetails.trim() || null
      }
      await ticketService.createTicket(token, ticketData, files)
      navigate('/tickets')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/tickets')}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaTicketAlt className="text-blue-600" />
                Report an Incident
              </h1>
              <p className="text-gray-600 mt-1">Provide details about the issue to notify campus maintenance.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resource */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Resource / Location <span className="text-red-500">*</span>
                </label>
                <select 
                  name="resourceId" 
                  value={form.resourceId} 
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.resourceId ? 'border-red-300 ring-red-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a resource...</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} — {r.location}</option>
                  ))}
                </select>
                {errors.resourceId && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.resourceId}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select 
                  name="category" 
                  value={form.category} 
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.category ? 'border-red-300 ring-red-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category...</option>
                  <option value="ELECTRICAL">⚡ Electrical</option>
                  <option value="PLUMBING">🔧 Plumbing</option>
                  <option value="HVAC">❄️ HVAC</option>
                  <option value="CLEANING">🧹 Cleaning</option>
                  <option value="IT_SUPPORT">💻 IT Support</option>
                  <option value="FURNITURE">🪑 Furniture</option>
                  <option value="SECURITY">🔒 Security</option>
                  <option value="OTHER">📋 Other</option>
                </select>
                {errors.category && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.category}</p>}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select 
                  name="priority" 
                  value={form.priority} 
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.priority ? 'border-red-300 ring-red-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select priority...</option>
                  <option value="LOW">🔵 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                </select>
                {errors.priority && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.priority}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the incident in detail..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
                    errors.description ? 'border-red-300 ring-red-100' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.description}</p>}
              </div>

              {/* Contact Details */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Contact Details (Optional)
                </label>
                <input
                  type="text"
                  name="contactDetails"
                  value={form.contactDetails}
                  onChange={handleChange}
                  placeholder="Phone number or alternative email..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Attach Images (max 3)
                </label>
                <ImageUploader files={files} setFiles={setFiles} maxFiles={3} />
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/tickets')}
              className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin" /> : null}
              {loading ? 'Submitting...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
