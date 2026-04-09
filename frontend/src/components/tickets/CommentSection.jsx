import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import ticketService from '../../services/ticketService'
import { FaEdit, FaTrash, FaPaperPlane, FaSpinner } from 'react-icons/fa'

export default function CommentSection({ ticketId }) {
  const { token, user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    fetchComments()
  }, [ticketId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const data = await ticketService.getComments(token, ticketId)
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newComment.trim() || submitting) return
    try {
      setSubmitting(true)
      const added = await ticketService.addComment(token, ticketId, newComment.trim())
      setComments(prev => [...prev, added])
      setNewComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return
    try {
      const updated = await ticketService.editComment(token, commentId, editContent.trim())
      setComments(prev => prev.map(c => c.id === commentId ? updated : c))
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      console.error('Failed to edit comment:', err)
    }
  }

  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    try {
      await ticketService.deleteComment(token, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-gray-500 text-sm">
            <FaSpinner className="animate-spin mr-2" /> Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm italic">
            No activity yet.
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4 items-start group">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold border border-blue-200">
                {comment.userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">{comment.userName}</span>
                  <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
                </div>
                
                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(comment.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => { setEditingId(null); setEditContent('') }}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-700 leading-relaxed break-words">
                      {comment.content}
                    </div>
                    {(comment.userId === user?.id || isAdmin) && (
                      <div className="mt-3 flex items-center gap-3 transition-opacity">
                        {comment.userId === user?.id && (
                          <button 
                            onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}
                            className="px-2 py-0.5 rounded text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 uppercase tracking-wider transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="px-2 py-0.5 rounded text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="pt-6 border-t border-gray-100">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          New Comment
        </label>
        <div className="relative">
          <textarea
            placeholder="Type your message here..."
            value={newComment}
            disabled={submitting}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-black bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] resize-none pr-12"
          />
          <button 
            onClick={handleAdd}
            disabled={!newComment.trim() || submitting}
            className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            {submitting ? <FaSpinner className="animate-spin w-4 h-4" /> : <FaPaperPlane className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
