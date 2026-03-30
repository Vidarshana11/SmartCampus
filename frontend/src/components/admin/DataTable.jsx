import { useState, useEffect } from 'react'
import propTypes from 'prop-types'
import { FaSpinner } from 'react-icons/fa'

export default function DataTable({
  columns,
  data,
  loading = false,
  error = null,
  pagination = null,
  onPageChange = null,
  onSearch = null,
  onFilter = null,
  actions = [],
  searchPlaceholder = 'Search...',
  filterOptions = null,
  filterLabel = 'Filter',
  emptyMessage = 'No data found',
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [localPage, setLocalPage] = useState(pagination?.current || 0)

  useEffect(() => {
    if (onSearch) {
      const timer = setTimeout(() => {
        onSearch(searchTerm)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm, onSearch])

  const handleFilterChange = (e) => {
    const value = e.target.value
    setFilterValue(value)
    if (onFilter) {
      onFilter(value)
    }
  }

  const handlePageChange = (newPage) => {
    setLocalPage(newPage)
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Filter */}
      <div className="flex gap-4 flex-col sm:flex-row">
        {onSearch && (
          <div className="flex-1">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
            />
          </div>
        )}
        {filterOptions && onFilter && (
          <div className="w-full sm:w-auto">
            <select
              value={filterValue}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%220066cc%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M7 7l6 6m0 0l6-6m-6 6v8%22%3E%3C/path%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5rem] pr-9 text-gray-900"
            >
              <option value="">All {filterLabel}</option>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-600">
          <FaSpinner className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      ) : data && data.length > 0 ? (
        <>
          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                      style={col.width ? { width: col.width } : {}}
                    >
                      {col.label}
                    </th>
                  ))}
                  {(Array.isArray(actions) ? actions.length > 0 : actions) && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => {
                  // Handle both static actions (array) and dynamic actions (function)
                  const rowActions = typeof actions === 'function' ? actions(row) : actions
                  return (
                    <tr key={row.id || rowIndex} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      {columns.map((col) => (
                        <td key={`${row.id || rowIndex}-${col.key}`} className="px-6 py-4 text-sm text-gray-900">
                          {col.render ? col.render(row[col.key], row) : row[col.key]}
                        </td>
                      ))}
                      {(Array.isArray(actions) ? actions.length > 0 : actions) && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {rowActions.map((action) => {
                              const baseClasses = 'px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                              const variantClasses = {
                                edit: 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:hover:bg-blue-100',
                                delete: 'bg-red-100 text-red-700 hover:bg-red-200 disabled:hover:bg-red-100',
                                approve: 'bg-green-100 text-green-700 hover:bg-green-200 disabled:hover:bg-green-100',
                                reject: 'bg-red-100 text-red-700 hover:bg-red-200 disabled:hover:bg-red-100',
                                default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100',
                              }
                              return (
                                <button
                                  key={action.label}
                                  className={`${baseClasses} ${variantClasses[action.variant] || variantClasses.default}`}
                                  onClick={() => action.onClick(row)}
                                  disabled={action.disabled ? action.disabled(row) : false}
                                  title={action.title}
                                >
                                  {action.label}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total > pagination.size && (
            <div className="flex items-center justify-center gap-4 py-4 flex-wrap">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(localPage - 1)}
                disabled={localPage === 0}
              >
                ← Previous
              </button>

              <span className="text-sm text-gray-600 whitespace-nowrap">
                Page {localPage + 1} of {Math.ceil(pagination.total / pagination.size)}
              </span>

              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(localPage + 1)}
                disabled={localPage >= Math.ceil(pagination.total / pagination.size) - 1}
              >
                Next →
              </button>

              <span className="text-sm text-gray-600 whitespace-nowrap">
                Showing {data.length} of {pagination.total} total
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  )
}

DataTable.propTypes = {
  columns: propTypes.arrayOf(
    propTypes.shape({
      key: propTypes.string.isRequired,
      label: propTypes.string.isRequired,
      width: propTypes.string,
      render: propTypes.func,
    })
  ).isRequired,
  data: propTypes.array,
  loading: propTypes.bool,
  error: propTypes.string,
  pagination: propTypes.shape({
    current: propTypes.number,
    size: propTypes.number,
    total: propTypes.number,
  }),
  onPageChange: propTypes.func,
  onSearch: propTypes.func,
  onFilter: propTypes.func,
  actions: propTypes.arrayOf(
    propTypes.shape({
      label: propTypes.string.isRequired,
      onClick: propTypes.func.isRequired,
      variant: propTypes.string,
      disabled: propTypes.func,
      title: propTypes.string,
    })
  ),
  searchPlaceholder: propTypes.string,
  filterOptions: propTypes.arrayOf(
    propTypes.shape({
      value: propTypes.string.isRequired,
      label: propTypes.string.isRequired,
    })
  ),
  filterLabel: propTypes.string,
  emptyMessage: propTypes.string,
}
