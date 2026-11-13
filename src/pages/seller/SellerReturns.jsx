/**
 * Seller Returns
 *
 * GET  /seller/returns?page=&limit=&status=
 *   → { success, data: { items: ReturnRequest[], total, page, limit } }
 *
 * PATCH /seller/returns/:returnId/approve  body: { note? }
 * PATCH /seller/returns/:returnId/reject   body: { note (required) }
 * PATCH /seller/returns/:returnId/received body: { note? }
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { RotateCcw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Package } from 'lucide-react'

const STATUS_COLOR = {
  REQUESTED:        'bg-yellow-100 text-yellow-700',
  APPROVED:         'bg-blue-100   text-blue-700',
  REJECTED:         'bg-red-100    text-red-700',
  CANCELLED:        'bg-gray-100   text-gray-500',
  ITEM_RECEIVED:    'bg-purple-100 text-purple-700',
  REFUND_INITIATED: 'bg-indigo-100 text-indigo-700',
  REFUND_FAILED:    'bg-red-100    text-red-700',
  REFUNDED:         'bg-green-100  text-green-700',
  CLOSED:           'bg-gray-100   text-gray-500',
}

const ALL_STATUSES = Object.keys(STATUS_COLOR)

function SellerReturns() {
  const [returns,    setReturns]    = useState([])   // ← data.items
  const [page,       setPage]       = useState(1)
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  /* modal: { type: 'approve'|'reject'|'received', id } */
  const [modal,       setModal]       = useState(null)
  const [noteValue,   setNoteValue]   = useState('')
  const [actionLoading,setActionLoading]= useState(false)
  const [actionError, setActionError] = useState('')

  const LIMIT = 10

  useEffect(() => { fetchReturns(1) }, [statusFilter])

  function fetchReturns(p) {
    setLoading(true)
    sellerService.listReturns({ page: p, limit: LIMIT, status: statusFilter || undefined })
      .then(res => {
        setReturns(res?.data?.items || [])
        setTotal(res?.data?.total  || 0)
        setPage(res?.data?.page    || p)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const totalPages = Math.ceil(total / LIMIT)

  const openModal = (type, id) => {
    setModal({ type, id })
    setNoteValue('')
    setActionError('')
  }

  const closeModal = () => {
    setModal(null)
    setNoteValue('')
    setActionError('')
  }

  const handleAction = async () => {
    if (!modal) return
    if (modal.type === 'reject' && !noteValue.trim()) {
      setActionError('A reason is required when rejecting a return.')
      return
    }
    setActionLoading(true)
    setActionError('')
    try {
      const body = noteValue.trim() ? { note: noteValue.trim() } : {}
      if (modal.type === 'approve')  await sellerService.approveReturn(modal.id, body)
      if (modal.type === 'reject')   await sellerService.rejectReturn(modal.id, body)
      if (modal.type === 'received') await sellerService.markReturnReceived(modal.id, body)
      closeModal()
      fetchReturns(page)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#101A30]">Return Requests</h2>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#2864F0]"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : returns.length === 0 ? (
          <div className="py-16 text-center">
            <RotateCcw size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[#52647D]">
              {statusFilter ? `No returns with status "${statusFilter}".` : 'No return requests yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Return ID', 'Return No.', 'Reason', 'Refund Amt', 'Date', 'Status', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-[#52647D] uppercase tracking-wide ${i === 6 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returns.map(r => (
                  <tr key={r.id} className="hover:bg-[#F0F0F8] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#101A30]">
                      #{r.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#52647D]">
                      {r.returnNumber || '—'}
                    </td>
                    <td className="px-5 py-3 max-w-[160px]">
                      <p className="text-[#101A30] text-sm truncate">{r.reason || '—'}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-[#101A30] whitespace-nowrap">
                      {r.refundAmount
                        ? `₹${Number(r.refundAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#52647D] whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'REQUESTED' && (
                          <>
                            <button
                              onClick={() => openModal('approve', r.id)}
                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold px-2 py-1 rounded-lg hover:bg-green-50"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => openModal('reject', r.id)}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <button
                            onClick={() => openModal('received', r.id)}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold px-2 py-1 rounded-lg hover:bg-purple-50"
                          >
                            <Package size={13} /> Mark Received
                          </button>
                        )}
                        {!['REQUESTED', 'APPROVED'].includes(r.status) && (
                          <span className="text-xs text-gray-400 italic">No action</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-[#52647D]">
              Showing {returns.length} of {total} returns
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchReturns(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-[#52647D] hover:border-[#2864F0] hover:text-[#2864F0] disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-[#52647D]">Page {page} of {totalPages}</span>
              <button
                onClick={() => fetchReturns(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-[#52647D] hover:border-[#2864F0] hover:text-[#2864F0] disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#101A30] mb-1 capitalize">
              {modal.type === 'received' ? 'Mark Item Received' : `${modal.type} Return`}
            </h3>
            <p className="text-sm text-[#52647D] mb-5">
              {modal.type === 'approve'  && 'The return will be approved and the customer will be notified to ship the item back.'}
              {modal.type === 'reject'   && 'Please provide a clear reason for rejection (required by policy).'}
              {modal.type === 'received' && 'Confirm that you have physically received the returned item from the customer.'}
            </p>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">
                {actionError}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#101A30] mb-1.5">
                Note {modal.type === 'reject' ? <span className="text-red-500">*</span> : <span className="text-[#52647D] font-normal">(optional)</span>}
              </label>
              <textarea
                value={noteValue}
                onChange={e => setNoteValue(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  modal.type === 'reject'
                    ? 'State the reason for rejection…'
                    : 'Add a note (optional)…'
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10 resize-none"
              />
              <p className="text-xs text-right text-[#52647D] mt-1">{noteValue.length}/500</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors ${
                  modal.type === 'reject'
                    ? 'bg-red-500 hover:bg-red-600'
                    : modal.type === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-[#2864F0] hover:bg-[#2878C8]'
                }`}
              >
                {actionLoading ? 'Processing…' : 'Confirm'}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#101A30] hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerReturns
