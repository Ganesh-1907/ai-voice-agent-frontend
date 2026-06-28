import { useState, useMemo, useCallback } from 'react'
import { RefreshCw, RotateCcw, Eye, X, MessageCircle, Send, Image, CheckCheck, Check, Clock, AlertCircle } from 'lucide-react'
import { WhatsAppMessage, WhatsAppMessageStatus } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useDbStore } from '@/data/db'
import { Pagination } from '@/components/Pagination'
import { FilterBar } from '@/components/FilterBar'

const ITEMS_PER_PAGE = 15

const STATUS_CONFIG: Record<WhatsAppMessageStatus, { label: string; color: string; icon: typeof Clock }> = {
  queued: { label: 'Queued', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Check },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', icon: CheckCheck },
  read: { label: 'Read', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300', icon: CheckCheck },
  failed: { label: 'Failed', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: AlertCircle },
}

const TYPE_ICON: Record<string, typeof MessageCircle> = {
  text: Send,
  interactive: MessageCircle,
  image: Image,
}

export function WhatsAppStatusPage() {
  const whatsappMessages = useDbStore((state) => state.whatsappMessages)
  const whatsappConfigured = useDbStore((state) => state.whatsappConfigured)
  const businesses = useDbStore((state) => state.businesses)
  const resendWhatsAppMessage = useDbStore((state) => state.resendWhatsAppMessage)
  const hydrateWhatsAppMessages = useDbStore((state) => state.hydrateWhatsAppMessages)
  const user = useAuthStore((state) => state.user)
  const getBusinessName = useDbStore((state) => state.getBusinessName)

  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showConversationModal, setShowConversationModal] = useState(false)
  const [conversationPhone, setConversationPhone] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await hydrateWhatsAppMessages()
    } finally {
      setRefreshing(false)
    }
  }, [hydrateWhatsAppMessages])

  const handleResend = useCallback(async (msg: WhatsAppMessage) => {
    setResendingIds((prev) => new Set(prev).add(msg.id))
    try {
      await resendWhatsAppMessage(msg.businessId, msg.id)
    } finally {
      setResendingIds((prev) => {
        const next = new Set(prev)
        next.delete(msg.id)
        return next
      })
    }
  }, [resendWhatsAppMessage])

  const handleViewConversation = useCallback((phone: string) => {
    setConversationPhone(phone)
    setShowConversationModal(true)
  }, [])

  // Filter messages
  const filteredMessages = useMemo(() => {
    let result = user?.role === 'admin' && user.businessId
      ? whatsappMessages.filter((m) => m.businessId === user.businessId)
      : whatsappMessages

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((m) =>
        m.customerPhone.includes(q) ||
        (m.body ?? '').toLowerCase().includes(q)
      )
    }

    if (businessFilter) {
      result = result.filter((m) => m.businessId === businessFilter)
    }

    if (statusFilter) {
      result = result.filter((m) => m.status === statusFilter)
    }

    return result
  }, [whatsappMessages, user, searchQuery, businessFilter, statusFilter])

  // Conversation messages for modal
  const conversationMessages = useMemo(() => {
    if (!conversationPhone) return []
    const normalizedPhone = conversationPhone.replace(/\D/g, '')
    return whatsappMessages
      .filter((m) => m.customerPhone.replace(/\D/g, '').includes(normalizedPhone) || normalizedPhone.includes(m.customerPhone.replace(/\D/g, '')))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [whatsappMessages, conversationPhone])

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE)
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearchChange = (val: string) => { setSearchQuery(val); setCurrentPage(1) }
  const handleBusinessFilterChange = (val: string) => { setBusinessFilter(val); setCurrentPage(1) }
  const handleStatusFilterChange = (val: string) => { setStatusFilter(val); setCurrentPage(1) }

  const businessOptions = businesses.map((b) => ({ value: b.id, label: b.name }))
  const statusOptions = [
    { value: 'queued', label: 'Queued' },
    { value: 'sent', label: 'Sent' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'read', label: 'Read' },
    { value: 'failed', label: 'Failed' },
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

  const truncateBody = (body?: string, max = 60) => {
    if (!body) return '—'
    return body.length > max ? body.slice(0, max) + '...' : body
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <MessageCircle size={22} className="text-white" />
            </div>
            WhatsApp Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Track message delivery status and manage WhatsApp conversations
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm shadow-lg shadow-green-500/20 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {!whatsappConfigured && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                WhatsApp Environment Variables Not Set
              </h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                <p>
                  WhatsApp integration requires <code>WHATSAPP_ACCESS_TOKEN</code> and <code>WHATSAPP_PHONE_NUMBER_ID</code> to be set in your backend <code>.env</code> file. The WhatsApp flow is currently skipped for all calls.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['queued', 'sent', 'delivered', 'read', 'failed'] as WhatsAppMessageStatus[]).map((status) => {
          const config = STATUS_CONFIG[status]
          const count = whatsappMessages.filter((m) => m.status === status).length
          const Icon = config.icon
          return (
            <button
              key={status}
              onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setCurrentPage(1) }}
              className={`rounded-xl p-3 border transition-all duration-200 ${
                statusFilter === status
                  ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } bg-white dark:bg-slate-800`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon size={14} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{config.label}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by phone or message..."
        filters={filters}
      />

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-sky-200/50 dark:border-sky-500/20 overflow-hidden sky-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Message Preview
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedMessages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <MessageCircle size={40} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium">No WhatsApp messages found</p>
                      <p className="text-sm">Messages will appear here after calls are completed</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMessages.map((msg) => {
                  const statusConfig = STATUS_CONFIG[msg.status]
                  const StatusIcon = statusConfig.icon
                  const TypeIcon = TYPE_ICON[msg.messageType] ?? Send

                  return (
                    <tr
                      key={msg.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <MessageCircle size={14} className="text-green-600 dark:text-green-400" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {msg.customerPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <TypeIcon size={14} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {msg.messageType}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {truncateBody(msg.body)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getBusinessName(msg.businessId)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => { setSelectedMessage(msg); setShowModal(true) }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                            title="View details"
                          >
                            <Eye size={15} className="text-indigo-600 dark:text-indigo-400" />
                          </button>
                          <button
                            onClick={() => handleViewConversation(msg.customerPhone)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                            title="View conversation"
                          >
                            <MessageCircle size={15} className="text-green-600 dark:text-green-400" />
                          </button>
                          {msg.status === 'failed' && (
                            <button
                              onClick={() => handleResend(msg)}
                              disabled={resendingIds.has(msg.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                              title="Resend message"
                            >
                              <RotateCcw size={12} className={resendingIds.has(msg.id) ? 'animate-spin' : ''} />
                              Resend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
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
            totalItems={filteredMessages.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Message Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedMessage.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Direction</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 capitalize">{selectedMessage.direction}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 capitalize">{selectedMessage.messageType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${STATUS_CONFIG[selectedMessage.status].color}`}>
                    {STATUS_CONFIG[selectedMessage.status].label}
                  </span>
                </div>
              </div>

              {selectedMessage.body && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Message Body</p>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.body}
                    </p>
                  </div>
                </div>
              )}

              {selectedMessage.errorMessage && (
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase mb-2">Error</p>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{selectedMessage.errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Created: {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedMessage.updatedAt).toLocaleString()}</p>
                {selectedMessage.providerMessageId && (
                  <p className="truncate">Provider ID: {selectedMessage.providerMessageId}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {selectedMessage.status === 'failed' && (
                  <button
                    onClick={() => { handleResend(selectedMessage); setShowModal(false) }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    <RotateCcw size={14} />
                    Resend Message
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Thread Modal */}
      {showConversationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conversation</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{conversationPhone}</p>
              </div>
              <button
                onClick={() => setShowConversationModal(false)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)' }}>
              {conversationMessages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No messages in this conversation</p>
              ) : (
                conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-green-500 text-white rounded-br-md'
                          : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                      }`}
                    >
                      {msg.messageType === 'image' && (
                        <div className="mb-2">
                          <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <Image size={24} className="text-gray-400" />
                          </div>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body ?? '(no text)'}</p>
                      {msg.messageType === 'interactive' && msg.buttonPayload && (
                        <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                          {((msg.buttonPayload as { buttons?: Array<{ title: string }> }).buttons ?? []).map((btn, i) => (
                            <div
                              key={i}
                              className={`text-xs font-medium text-center py-1.5 rounded-lg ${
                                msg.direction === 'outbound'
                                  ? 'bg-white/20'
                                  : 'bg-gray-100 dark:bg-slate-600'
                              }`}
                            >
                              {btn.title}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center gap-1 mt-1 ${
                        msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className={`text-[10px] ${
                          msg.direction === 'outbound' ? 'text-green-100' : 'text-gray-400'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.direction === 'outbound' && (
                          <span className="ml-0.5">
                            {msg.status === 'read' && <CheckCheck size={12} className="text-blue-200" />}
                            {msg.status === 'delivered' && <CheckCheck size={12} className="text-green-100" />}
                            {msg.status === 'sent' && <Check size={12} className="text-green-100" />}
                            {msg.status === 'queued' && <Clock size={10} className="text-green-100" />}
                            {msg.status === 'failed' && <AlertCircle size={12} className="text-red-300" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => setShowConversationModal(false)}
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
