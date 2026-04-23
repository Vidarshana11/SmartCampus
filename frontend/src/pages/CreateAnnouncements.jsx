import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import AnnouncementsTab from '../components/admin/AnnouncementsTab'
import {
  deleteMyAnnouncementHistory,
  getAnnouncementUrgencyMeta,
  getMyAnnouncementHistory,
  updateMyAnnouncementHistory,
} from '../services/notificationService'

const toDateTimeLocalValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  const localDate = new Date(date.getTime() - offset)
  return localDate.toISOString().slice(0, 16)
}

const formatDateTime = (value) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const formatTargetRoles = (targetRoles) => {
  if (!targetRoles) return 'All roles'
  if (Array.isArray(targetRoles)) return targetRoles.join(', ')
  return String(targetRoles)
}

export default function CreateAnnouncements() {
  const { user, token } = useAuth()
  usePageTitle('Create Announcements')
  const historySectionRef = useRef(null)

  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [editingCampaignId, setEditingCampaignId] = useState('')
  const [editingDraft, setEditingDraft] = useState({
    title: '',
    message: '',
    enabled: true,
    scheduleAt: '',
    expiresAt: '',
    recurrenceMinutes: '',
  })
  const [savingCampaignId, setSavingCampaignId] = useState('')
  const [togglingCampaignId, setTogglingCampaignId] = useState('')
  const [deletingCampaignId, setDeletingCampaignId] = useState('')

  const creatorRole = user?.role
  const description = useMemo(() => {
    if (creatorRole === 'LECTURER') {
      return 'Lecturers can create announcements for students and manage their own history here.'
    }
    if (creatorRole === 'MANAGER') {
      return 'Managers can create announcements for students, lecturers, and technicians, then edit their own past announcements.'
    }
    return 'Create role-based announcements and review the ones you already sent.'
  }, [creatorRole])

  const loadHistory = async () => {
    if (!token) return
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const items = await getMyAnnouncementHistory(token)
      setHistory(items)
    } catch (error) {
      setHistoryError(error?.response?.data?.error || 'Failed to load your past announcements')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (showHistory) {
      loadHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, token])

  const handleToggleHistory = async () => {
    const nextValue = !showHistory
    setShowHistory(nextValue)
    if (nextValue) {
      await loadHistory()
      historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const beginEdit = (item) => {
    setActionMessage('')
    setActionError('')
    setEditingCampaignId(item.campaignId)
    setEditingDraft({
      title: item.title || '',
      message: item.message || '',
      enabled: Boolean(item.isEnabled),
      scheduleAt: toDateTimeLocalValue(item.scheduledAt),
      expiresAt: toDateTimeLocalValue(item.expiresAt),
      recurrenceMinutes: item.recurrenceMinutes ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingCampaignId('')
    setEditingDraft({
      title: '',
      message: '',
      enabled: true,
      scheduleAt: '',
      expiresAt: '',
      recurrenceMinutes: '',
    })
  }

  const saveEdit = async (campaignId) => {
    if (!token) return
    setSavingCampaignId(campaignId)
    setActionError('')
    setActionMessage('')
    try {
      await updateMyAnnouncementHistory(token, campaignId, {
        title: editingDraft.title,
        message: editingDraft.message,
        enabled: editingDraft.enabled,
        scheduleAt: editingDraft.scheduleAt || null,
        expiresAt: editingDraft.expiresAt || null,
        recurrenceMinutes: editingDraft.recurrenceMinutes === ''
          ? null
          : Number(editingDraft.recurrenceMinutes),
      })
      setActionMessage('Announcement updated successfully')
      cancelEdit()
      await loadHistory()
    } catch (error) {
      setActionError(error?.response?.data?.error || 'Failed to update announcement')
    } finally {
      setSavingCampaignId('')
    }
  }

  const toggleEnabled = async (item) => {
    if (!token) return
    setTogglingCampaignId(item.campaignId)
    setActionError('')
    setActionMessage('')
    try {
      await updateMyAnnouncementHistory(token, item.campaignId, {
        enabled: !item.isEnabled,
      })
      setActionMessage(item.isEnabled ? 'Announcement disabled' : 'Announcement enabled')
      await loadHistory()
    } catch (error) {
      setActionError(error?.response?.data?.error || 'Failed to change announcement status')
    } finally {
      setTogglingCampaignId('')
    }
  }

  const deleteAnnouncement = async (item) => {
    if (!token) return
    const confirmed = window.confirm('Delete this announcement permanently?')
    if (!confirmed) return

    setDeletingCampaignId(item.campaignId)
    setActionError('')
    setActionMessage('')
    try {
      await deleteMyAnnouncementHistory(token, item.campaignId)
      setActionMessage('Announcement deleted successfully')
      if (editingCampaignId === item.campaignId) {
        cancelEdit()
      }
      await loadHistory()
    } catch (error) {
      setActionError(error?.response?.data?.error || 'Failed to delete announcement')
    } finally {
      setDeletingCampaignId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Announcements</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleToggleHistory}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {showHistory ? 'Hide My Past Announcements' : 'See My Past Announcements'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <section ref={historySectionRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Your Past Announcements</h2>
              <p className="mt-1 text-sm text-slate-600">
                Edit, disable, or delete the announcements you created.
              </p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {historyLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Loading your announcements...
              </div>
            ) : historyError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                You have not created any announcements yet.
              </div>
            ) : (
              history.map((item) => {
                const urgencyMeta = getAnnouncementUrgencyMeta(item.type)
                const isEditing = editingCampaignId === item.campaignId
                const isBusy = savingCampaignId === item.campaignId
                  || togglingCampaignId === item.campaignId
                  || deletingCampaignId === item.campaignId

                return (
                  <article key={item.campaignId} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyMeta.chipClass}`}>
                            {urgencyMeta.label}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                            {item.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {formatTargetRoles(item.targetRoles)}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="grid gap-4 lg:grid-cols-2">
                            <label className="space-y-2 lg:col-span-2">
                              <span className="text-sm font-medium text-slate-700">Title</span>
                              <input
                                value={editingDraft.title}
                                onChange={(event) => setEditingDraft((current) => ({ ...current, title: event.target.value }))}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
                              />
                            </label>
                            <label className="space-y-2 lg:col-span-2">
                              <span className="text-sm font-medium text-slate-700">Message</span>
                              <textarea
                                value={editingDraft.message}
                                onChange={(event) => setEditingDraft((current) => ({ ...current, message: event.target.value }))}
                                rows={4}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">Schedule At</span>
                              <input
                                type="datetime-local"
                                value={editingDraft.scheduleAt}
                                onChange={(event) => setEditingDraft((current) => ({ ...current, scheduleAt: event.target.value }))}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">Expires At</span>
                              <input
                                type="datetime-local"
                                value={editingDraft.expiresAt}
                                onChange={(event) => setEditingDraft((current) => ({ ...current, expiresAt: event.target.value }))}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">Recurrence Minutes</span>
                              <input
                                type="number"
                                min="0"
                                value={editingDraft.recurrenceMinutes}
                                onChange={(event) => setEditingDraft((current) => ({ ...current, recurrenceMinutes: event.target.value }))}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                              />
                            </label>
                            <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
                              <input
                                type="checkbox"
                                checked={editingDraft.enabled}
                                onChange={(event) => setEditingDraft((current) => ({ ...current, enabled: event.target.checked }))}
                                className="h-4 w-4 rounded border-slate-400 text-slate-900"
                              />
                              <span className="text-sm font-medium text-slate-700">Enabled</span>
                            </label>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                              <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm text-slate-700">{item.message}</p>
                            </div>
                            <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                              <span>Created: {formatDateTime(item.createdAt)}</span>
                              <span>Schedule: {formatDateTime(item.scheduledAt)}</span>
                              <span>Expiry: {formatDateTime(item.expiresAt)}</span>
                              <span>Recurrence: {item.recurrenceMinutes ? `${item.recurrenceMinutes} minutes` : 'None'}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => saveEdit(item.campaignId)}
                              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                              {savingCampaignId === item.campaignId ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={cancelEdit}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => beginEdit(item)}
                              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => toggleEnabled(item)}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {togglingCampaignId === item.campaignId ? 'Updating...' : item.isEnabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => deleteAnnouncement(item)}
                              className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingCampaignId === item.campaignId ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      ) : null}

      <AnnouncementsTab
        token={token}
        mode="role-based"
        creatorRole={creatorRole}
        heading="Create Role-Based Announcement"
        description={description}
      />

      {actionMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionMessage}
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

    </div>
  )
}
