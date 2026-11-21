
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Package,
  RefreshCw,
} from 'lucide-react'

const PAGE_SIZE = 10

const statuses = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'ITEM_RECEIVED',
  'REFUND_INITIATED',
  'REFUND_FAILED',
  'REFUNDED',
  'CLOSED',
]

const STATUS_COLOR = {
  REQUESTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  ITEM_RECEIVED: 'bg-purple-100 text-purple-700',
  REFUND_INITIATED: 'bg-indigo-100 text-indigo-700',
  REFUND_FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
}

function formatAmount(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return '—'

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatStatus(value) {
  return (value || '').replace(/_/g, ' ')
}

function AdminReturns() {
  const [returns, setReturns] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [statusFilter, setStatusFilter] = useState('')
  const [escalatedOnly, setEscalatedOnly] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [modal, setModal] = useState(null)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Load return requests
  useEffect(() => {
    let cancelled = false

    async function loadReturns() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()

        params.set('page', String(page))
        params.set('limit', String(PAGE_SIZE))

        if (statusFilter) {
          params.set('status', statusFilter)
        }

        if (escalatedOnly) {
          params.set('escalatedOnly', 'true')
        }

        const res = await apiRequest(
          `/admin/returns?${params.toString()}`
        )

        if (!cancelled) {
          setReturns(res.data?.items || [])
          setTotal(res.data?.total || 0)
          setPage(res.data?.page || page)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Could not load return requests.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadReturns()

    return () => {
      cancelled = true
    }
  }, [page, statusFilter, escalatedOnly, reloadKey])

  // Open confirmation modal
  const openModal = (type, returnItem) => {
    setModal({ type, returnItem })
    setNote('')
    setActionError('')
  }

  // Close modal
  const closeModal = () => {
    if (actionLoading) return

    setModal(null)
    setNote('')
    setActionError('')
  }

  // Status filter
  const handleFilterChange = (value) => {
    setStatusFilter(value)
    setPage(1)
    setSuccessMessage('')
  }

  // Escalated filter
  const handleEscalatedChange = (checked) => {
    setEscalatedOnly(checked)
    setPage(1)
    setSuccessMessage('')
  }

  // Handle admin actions
  const handleAction = async () => {
    if (!modal) return

    if (modal.type === 'reject' && !note.trim()) {
      setActionError(
        'A reason is required when rejecting a return.'
      )
      return
    }

    const returnId = modal.returnItem.id

    const body = note.trim()
      ? { note: note.trim() }
      : {}

    const endpoints = {
      approve: {
        path: `/admin/returns/${returnId}/approve`,
        method: 'PATCH',
        message: 'Return approved successfully.',
      },

      reject: {
        path: `/admin/returns/${returnId}/reject`,
        method: 'PATCH',
        message: 'Return rejected successfully.',
      },

      received: {
        path: `/admin/returns/${returnId}/received`,
        method: 'PATCH',
        message: 'Returned item marked as received.',
      },
    }

    const action = endpoints[modal.type]

    if (!action) return

    try {
      setActionLoading(true)
      setActionError('')
      setError('')
      setSuccessMessage('')

      await apiRequest(action.path, {
        method: action.method,
        body: JSON.stringify(body),
      })

      setModal(null)
      setNote('')

      setSuccessMessage(action.message)

      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(
        err.message || 'Action failed. Please try again.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <h2 className="text-2xl font-bold text-[#101A30]">
            Returns & Refunds
          </h2>

          <p className="text-sm text-[#52647D] mt-1">
            Manage customer return requests. ({total} total)
          </p>
        </div>

        <button
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-[#101A30] hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>

      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">

        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#101A30] outline-none focus:border-[#2864F0]"
        >
          <option value="">All statuses</option>

          {statuses.map((status) => (
            <option key={status} value={status}>
              {formatStatus(status)}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#101A30] cursor-pointer">

          <input
            type="checkbox"
            checked={escalatedOnly}
            onChange={(e) =>
              handleEscalatedChange(e.target.checked)
            }
            className="accent-[#2864F0]"
          />

          Escalated only

        </label>

      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
          {successMessage}
        </div>
      )}

      {/* Returns Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">

        {loading ? (

          <div className="p-8 text-center text-sm text-[#52647D]">
            Loading return requests...
          </div>

        ) : returns.length === 0 ? (

          <div className="p-12 text-center">

            <RotateCcw
              size={38}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="text-sm text-[#52647D]">
              No return requests found.
            </p>

          </div>

        ) : (

          <table className="w-full text-sm">

            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100 bg-gray-50">

                <th className="px-5 py-4 font-medium">
                  Return ID
                </th>

                <th className="px-5 py-4 font-medium">
                  Return No.
                </th>

                <th className="px-5 py-4 font-medium">
                  Reason
                </th>

                <th className="px-5 py-4 font-medium">
                  Refund Amount
                </th>

                <th className="px-5 py-4 font-medium">
                  Date
                </th>

                <th className="px-5 py-4 font-medium">
                  Status
                </th>

                <th className="px-5 py-4 font-medium">
                  Escalation
                </th>

                <th className="px-5 py-4 font-medium text-right">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {returns.map((item) => (

                <tr
                  key={item.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-[#F8F9FC]"
                >

                  {/* Return ID */}
                  <td className="px-5 py-4 font-mono text-xs text-[#101A30]">
                    #{item.id?.slice(-8).toUpperCase()}
                  </td>

                  {/* Return Number */}
                  <td className="px-5 py-4 font-mono text-xs text-[#52647D] whitespace-nowrap">
                    {item.returnNumber || '—'}
                  </td>

                  {/* Reason */}
                  <td className="px-5 py-4 text-[#101A30] max-w-[180px]">

                    <p className="truncate">
                      {item.reason || '—'}
                    </p>

                    {item.escalationReason && (
                      <p className="text-xs text-orange-600 mt-1 truncate">
                        Escalation: {item.escalationReason}
                      </p>
                    )}

                  </td>

                  {/* Refund Amount */}
                  <td className="px-5 py-4 font-medium text-[#101A30] whitespace-nowrap">
                    {formatAmount(item.refundAmount)}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-xs text-[#52647D] whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">

                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        STATUS_COLOR[item.status] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formatStatus(item.status)}
                    </span>

                  </td>

                  {/* Escalation */}
                  <td className="px-5 py-4">

                    {item.escalatedAt ? (

                      <span className="text-xs font-semibold text-orange-600">
                        Escalated
                      </span>

                    ) : (

                      <span className="text-xs text-gray-400">
                        —
                      </span>

                    )}

                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">

                    <div className="flex items-center justify-end gap-2">

                      {/* Approve and Reject */}
                      {item.status === 'REQUESTED' && (
                        <>

                          <button
                            onClick={() =>
                              openModal('approve', item)
                            }
                            title="Approve return"
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle size={17} />
                          </button>

                          <button
                            onClick={() =>
                              openModal('reject', item)
                            }
                            title="Reject return"
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                          >
                            <XCircle size={17} />
                          </button>

                        </>
                      )}

                      {/* Mark Received */}
                      {item.status === 'APPROVED' && (
                        <button
                          onClick={() =>
                            openModal('received', item)
                          }
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 whitespace-nowrap"
                        >
                          <Package size={14} />
                          Mark Received
                        </button>
                      )}

                      {/* Refund temporarily unavailable */}
                      {item.status === 'ITEM_RECEIVED' && (
                        <span
                          title="Payment method is not available in the current admin returns API response."
                          className="text-xs text-orange-600 whitespace-nowrap"
                        >
                          Refund unavailable
                        </span>
                      )}

                      {/* No action */}
                      {![
                        'REQUESTED',
                        'APPROVED',
                        'ITEM_RECEIVED',
                      ].includes(item.status) && (
                        <span className="text-xs text-gray-400">
                          No action
                        </span>
                      )}

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (

        <div className="flex flex-wrap items-center justify-between gap-3">

          <p className="text-sm text-[#52647D]">
            Showing {returns.length} of {total} returns
          </p>

          <div className="flex items-center gap-3">

            <button
              disabled={page <= 1}
              onClick={() =>
                setPage((current) => current - 1)
              }
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#101A30] disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-[#52647D]">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => current + 1)
              }
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#101A30] disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>

          </div>

        </div>

      )}

      {/* Action Confirmation Modal */}
      {modal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <h3 className="text-lg font-bold text-[#101A30] mb-2">

              {modal.type === 'received' &&
                'Mark Item as Received'}

              {modal.type === 'approve' &&
                'Approve Return'}

              {modal.type === 'reject' &&
                'Reject Return'}

            </h3>

            <p className="text-sm text-[#52647D] mb-4">
              Return:{' '}
              {modal.returnItem.returnNumber ||
                modal.returnItem.id}
            </p>

            {/* Approve Message */}
            {modal.type === 'approve' && (
              <p className="text-sm text-[#52647D] mb-4">
                Approve this return request?
              </p>
            )}

            {/* Reject Message */}
            {modal.type === 'reject' && (
              <p className="text-sm text-[#52647D] mb-4">
                Please provide a reason for rejecting this return.
              </p>
            )}

            {/* Received Message */}
            {modal.type === 'received' && (
              <p className="text-sm text-[#52647D] mb-4">
                Confirm that the returned item has physically arrived.
              </p>
            )}

            {/* Action Error */}
            {actionError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            {/* Note */}
            <label className="block text-sm font-semibold text-[#101A30] mb-2">
              Note {modal.type === 'reject'
                ? '(required)'
                : '(optional)'}
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={
                modal.type === 'reject'
                  ? 'Enter rejection reason...'
                  : 'Add a note (optional)...'
              }
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2864F0]"
            />

            <p className="text-xs text-right text-[#52647D] mt-1 mb-5">
              {note.length}/500
            </p>

            {/* Modal Buttons */}
            <div className="flex gap-3">

              <button
                onClick={handleAction}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-[#2864F0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2878C8] disabled:opacity-50"
              >
                {actionLoading
                  ? 'Processing...'
                  : 'Confirm'}
              </button>

              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#101A30] hover:bg-gray-50 disabled:opacity-50"
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

export default AdminReturns
