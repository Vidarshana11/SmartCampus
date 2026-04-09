export default function StatusBadge({ status }) {
  const config = {
    OPEN: 'bg-blue-50 text-blue-700 border border-blue-200',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    RESOLVED: 'bg-green-50 text-green-700 border border-green-200',
    CLOSED: 'bg-gray-100 text-gray-600 border border-gray-200',
    REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  }

  const labels = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    REJECTED: 'Rejected',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config[status] || config.OPEN}`}>
      {labels[status] || status}
    </span>
  )
}
