import propTypes from 'prop-types'

const STATUS_CONFIG = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  OUT_OF_SERVICE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Out of Service' },
  INFO: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Info' },
  SUCCESS: { bg: 'bg-green-100', text: 'text-green-800', label: 'Success' },
  WARNING: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Warning' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' },
  STUDENT: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Student' },
  LECTURER: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Lecturer' },
  TECHNICIAN: { bg: 'bg-green-100', text: 'text-green-800', label: 'Technician' },
  MANAGER: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Manager' },
  ADMIN: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' },
  USER: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'User' },
}

export default function StatusBadge({ status, size = 'md', showIcon = false }) {
  const config = STATUS_CONFIG[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      {showIcon && <span>●</span>}
      {config.label}
    </span>
  )
}

StatusBadge.propTypes = {
  status: propTypes.string.isRequired,
  size: propTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: propTypes.bool,
}