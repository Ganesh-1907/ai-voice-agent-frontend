import { useState, useMemo } from 'react'
import { Eye, X } from 'lucide-react'
import { CallbackRequest } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useDbStore } from '@/data/db'
import { Pagination } from '@/components/Pagination'
import { FilterBar } from '@/components/FilterBar'

const ITEMS_PER_PAGE = 10

export function CallbackRequestsPage() {
  const callbackRequests = useDbStore((state) => state.callbackRequests)
  const businesses = useDbStore((state) => state.businesses)
  const updateCallbackRequest = useDbStore((state) => state.updateCallbackRequest)
  const user = useAuthStore((state) => state.user)

  const [selectedRequest, setSelectedRequest] = useState<CallbackRequest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const handleUpdateStatus = (requestId: string, newStatus: 'called' | 'not-called') => {
    updateCallbackRequest(requestId, { status: newStatus })

    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: newStatus })
    }
  }

  const handleViewDetails = (request: CallbackRequest) => {
    setSelectedRequest(request)
    setShowModal(true)
  }

  // Format transcript with proper speaker lines
  const formatTranscript = (transcript: string) => {
    if (!transcript) return null
    const lines = transcript.split('\n')
    return lines.map((line, idx) => {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0 && colonIdx < 30) {
        const speaker = line.substring(0, colonIdx)
        const message = line.substring(colonIdx + 1).trim()
        return (
          <div key={idx} className="mb-3 last:mb-0">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{speaker}:</span>
            <span className="ml-1 text-gray-800 dark:text-gray-200">{message}</span>
          </div>
        )
      }
      return (
        <div key={idx} className="mb-3 last:mb-0 text-gray-800 dark:text-gray-200">
          {line}
        </div>
      )
    })
  }

  // Filtering logic
  const filteredRequests = useMemo(() => {
    let result = user?.role === 'admin'
      ? callbackRequests.filter((r) => r.businessId === user.businessId)
      : callbackRequests

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((r) => r.customerNumber.toLowerCase().includes(q))
    }

    if (businessFilter) {
      result = result.filter((r) => r.businessId === businessFilter)
    }

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter)
    }

    return result
  }, [callbackRequests, user, searchQuery, businessFilter, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearchChange = (val: string) => { setSearchQuery(val); setCurrentPage(1) }
  const handleBusinessFilterChange = (val: string) => { setBusinessFilter(val); setCurrentPage(1) }
  const handleStatusFilterChange = (val: string) => { setStatusFilter(val); setCurrentPage(1) }

  const businessOptions = businesses.map((b) => ({ value: b.id, label: b.name }))
  const statusOptions = [
    { value: 'called', label: 'Called' },
    { value: 'not-called', label: 'Not Called' },
  ]

  const filters = []
  if (user?.role === 'super-admin') {
    filters.push({
      label: 'All Businesses',
      value: businessFilter,
      onChange: handleBusinessFilterChange,
      options: businessOptions,
    })
  }
  filters.push({
    label: 'All Statuses',
    value: statusFilter,
    onChange: handleStatusFilterChange,
    options: statusOptions,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Callback Requests</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage customer callback requests</p>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by phone number..."
        filters={filters}
      />

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-sky-200/50 dark:border-sky-500/20 overflow-hidden sky-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Customer Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No callback requests found
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {request.customerNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {request.businessName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          request.status === 'called'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}
                      >
                        {request.status === 'called' ? 'Called' : 'Not Called'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                          title="View details"
                        >
                          <Eye size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* Details Modal — Summary + Transcript */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Callback Request Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close callback request details"
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              {selectedRequest.summary && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Summary
                  </h3>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {selectedRequest.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {selectedRequest.transcript && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Transcript
                  </h3>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                    {formatTranscript(selectedRequest.transcript)}
                  </div>
                </div>
              )}

              {!selectedRequest.summary && !selectedRequest.transcript && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No summary or transcript available.
                </p>
              )}

              {/* Status Update (Only for Admin) */}
              {user?.role === 'admin' && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Update Status
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'called')}
                      className={`flex-1 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                        selectedRequest.status === 'called'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Mark as Called
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'not-called')}
                      className={`flex-1 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                        selectedRequest.status === 'not-called'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Mark as Not Called
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
