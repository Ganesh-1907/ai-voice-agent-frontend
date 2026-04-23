import { useState, useMemo } from 'react'
import { Eye, X } from 'lucide-react'
import { CallLead } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useDbStore } from '@/data/db'
import { Pagination } from '@/components/Pagination'
import { FilterBar } from '@/components/FilterBar'

const ITEMS_PER_PAGE = 10

export function CallLeadsPage() {
  const callLeads = useDbStore((state) => state.callLeads)
  const businesses = useDbStore((state) => state.businesses)
  const updateCallLead = useDbStore((state) => state.updateCallLead)
  const user = useAuthStore((state) => state.user)

  const [selectedLead, setSelectedLead] = useState<CallLead | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const handleMarkAsRead = (id: string) => {
    updateCallLead(id, { status: 'read' })
  }

  const handleViewDetails = (lead: CallLead) => {
    setSelectedLead(lead)
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
  const filteredLeads = useMemo(() => {
    let result = user?.role === 'admin'
      ? callLeads.filter((l) => l.businessId === user.businessId)
      : callLeads

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((l) => l.fromNumber.toLowerCase().includes(q))
    }

    if (businessFilter) {
      result = result.filter((l) => l.businessId === businessFilter)
    }

    if (statusFilter) {
      result = result.filter((l) => l.status === statusFilter)
    }

    return result
  }, [callLeads, user, searchQuery, businessFilter, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearchChange = (val: string) => { setSearchQuery(val); setCurrentPage(1) }
  const handleBusinessFilterChange = (val: string) => { setBusinessFilter(val); setCurrentPage(1) }
  const handleStatusFilterChange = (val: string) => { setStatusFilter(val); setCurrentPage(1) }

  const businessOptions = businesses.map((b) => ({ value: b.id, label: b.name }))
  const statusOptions = [
    { value: 'read', label: 'Read' },
    { value: 'unread', label: 'Unread' },
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Call Leads</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">View and manage incoming call leads</p>
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
                  From Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Duration
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
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No call leads found
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                      lead.status === 'unread' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {lead.fromNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {lead.businessName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          lead.status === 'read'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}
                      >
                        {lead.status === 'read' ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm">
                      {Math.floor(lead.duration / 60)}m {lead.duration % 60}s
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(lead)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                          title="View details"
                        >
                          <Eye size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </button>
                        {lead.status === 'unread' && user?.role === 'admin' && (
                          <button
                            onClick={() => handleMarkAsRead(lead.id)}
                            className="px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
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
            totalItems={filteredLeads.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* Details Modal — Only Summary + Transcript */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Call Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close call lead details"
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              {selectedLead.summary && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Summary
                  </h3>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {selectedLead.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {selectedLead.transcript && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Transcript
                  </h3>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                    {formatTranscript(selectedLead.transcript)}
                  </div>
                </div>
              )}

              {!selectedLead.summary && !selectedLead.transcript && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No summary or transcript available.
                </p>
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
