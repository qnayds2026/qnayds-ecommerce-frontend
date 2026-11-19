import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../services/api'

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDay(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatStatus(status) {
  return (status || '').replaceAll('_', ' ')
}

// NEW: readable payment method name
function formatPaymentMethod(method) {
  if (method === 'COD') return 'Cash on Delivery'
  if (method === 'ONLINE') return 'Online payment'
  return method || '-'
}

// NEW: payment status badge colors
const paymentBadgeColors = {
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  CAPTURED: 'bg-green-50 text-green-700 border-green-200',
}

// Steps shown in the tracking timeline (same order as the backend flow)
const TRACK_STEPS = [
  { key: 'PACKED', label: 'Packed', text: 'Seller has packed your item' },
  { key: 'SHIPPED', label: 'Shipped', text: 'Your item has been shipped' },
  { key: 'IN_TRANSIT', label: 'In transit', text: 'Your item is on the way' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', text: 'Your item is out for delivery' },
  { key: 'DELIVERED', label: 'Delivered', text: 'Your item has been delivered' },
]

function stepIndex(status) {
  // READY_TO_SHIP is before PACKED, so it returns -1
  return TRACK_STEPS.findIndex((s) => s.key === status)
}

function ShipmentTimeline({ shipment, orderPlacedAt }) {
  const current = stepIndex(shipment.status)
  const failed = shipment.status === 'DELIVERY_FAILED'
  const returned = shipment.status === 'RETURN_TO_ORIGIN'
  const showExpected =
    shipment.estimatedDeliveryAt &&
    shipment.status !== 'DELIVERED' &&
    shipment.status !== 'RETURN_TO_ORIGIN'

  const dot = (done) =>
    `absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
      done ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
    }`

  return (
    <div>
      {showExpected && (
        <p className="mb-4 text-sm text-[#101A30]">
          <span className="text-[#52647D]">Expected delivery: </span>
          <span className="font-semibold">{formatDay(shipment.estimatedDeliveryAt)}</span>
        </p>
      )}

      <ol className="border-l-2 border-gray-200 ml-2 space-y-6">
        <li className="pl-6 relative">
          <span className={dot(true)} />
          <p className="font-medium text-[#101A30]">Order Confirmed</p>
          <p className="text-xs text-[#52647D] mt-0.5">{formatDate(orderPlacedAt)}</p>
        </li>

        {TRACK_STEPS.map((step, i) => {
          const done = current >= i
          return (
            <li key={step.key} className="pl-6 relative">
              <span className={dot(done)} />
              <p className={`font-medium ${done ? 'text-[#101A30]' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {done && <p className="text-sm text-[#52647D] mt-0.5">{step.text}</p>}

              {step.key === 'SHIPPED' && done && (
                <div className="mt-1 text-sm">
                  <p className="text-[#101A30]">
                    {shipment.carrierName} - {shipment.trackingNumber}
                  </p>
                  {shipment.shippedAt && (
                    <p className="text-xs text-[#52647D]">{formatDate(shipment.shippedAt)}</p>
                  )}
                  {shipment.trackingUrl && (
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#2864F0] hover:underline"
                    >
                      Track shipment
                    </a>
                  )}
                </div>
              )}
            </li>
          )
        })}

        {failed && (
          <li className="pl-6 relative">
            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-red-500 border-red-500" />
            <p className="font-medium text-red-600">Delivery failed</p>
            <p className="text-sm text-[#52647D] mt-0.5">
              Delivery attempt was unsuccessful
            </p>
          </li>
        )}
        {returned && (
          <li className="pl-6 relative">
            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-gray-500 border-gray-500" />
            <p className="font-medium text-[#101A30]">Returned to seller</p>
          </li>
        )}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Returns (customer side)
//   POST   /returns                     create a return request
//   GET    /returns/my                  my returns
//   PATCH  /returns/:id/cancel          cancel (REQUESTED / APPROVED)
//   PATCH  /returns/:id/shipment        courier details (APPROVED)
//   POST   /returns/:id/escalate        ask admin to review (REJECTED)
// ---------------------------------------------------------------------------
const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Item is defective' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'SIZE_ISSUE', label: 'Size issue' },
  { value: 'CHANGED_MIND', label: 'Changed my mind' },
  { value: 'OTHER', label: 'Other (please describe)' },
]

function reasonLabel(value) {
  return RETURN_REASONS.find((r) => r.value === value)?.label || formatStatus(value)
}

const RETURN_STATUS_COLORS = {
  REQUESTED: 'bg-yellow-50 text-yellow-800',
  APPROVED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  ITEM_RECEIVED: 'bg-purple-50 text-purple-700',
  REFUND_INITIATED: 'bg-indigo-50 text-indigo-700',
  REFUND_FAILED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
}

// Statuses where the returned quantity is already used up (same list as the backend)
const ACTIVE_RETURN_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'ITEM_RECEIVED',
  'REFUND_INITIATED',
  'REFUND_FAILED',
  'REFUNDED',
  'CLOSED',
]

function ReturnsSection({ order }) {
  const [returns, setReturns] = useState([])
  const [loadingReturns, setLoadingReturns] = useState(true)
  const [pageError, setPageError] = useState('')

  // New return request form
  const [showForm, setShowForm] = useState(false)
  const [qtyByItem, setQtyByItem] = useState({}) // { orderItemId: quantity }
  const [reason, setReason] = useState('DEFECTIVE')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Action on an existing return: cancel / shipment / escalate
  const [action, setAction] = useState(null) // { type, id }
  const [actionNote, setActionNote] = useState('')
  const [carrierName, setCarrierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const loadReturns = () =>
    apiRequest('/returns/my?page=1&limit=50')
      .then((res) => {
        const all = res?.data?.items || []
        setReturns(all.filter((r) => r.orderId === order.id))
        setPageError('')
      })
      .catch((err) => setPageError(err?.message || 'Could not load returns'))

  useEffect(() => {
    setLoadingReturns(true)
    loadReturns().finally(() => setLoadingReturns(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id])

  // Only items of DELIVERED seller orders can be returned
  const deliveredSellerOrderIds = new Set(
    (order.sellerOrders || []).filter((so) => so.status === 'DELIVERED').map((so) => so.id)
  )

  // Quantity already used by active returns of this order
  const usedQty = {}
  returns
    .filter((r) => ACTIVE_RETURN_STATUSES.includes(r.status))
    .forEach((r) =>
      (r.items || []).forEach((i) => {
        usedQty[i.orderItemId] = (usedQty[i.orderItemId] || 0) + i.quantity
      })
    )

  const eligibleItems = (order.orderItems || [])
    .filter((i) => deliveredSellerOrderIds.has(i.sellerOrderId))
    .map((i) => ({ ...i, remaining: i.quantity - (usedQty[i.id] || 0) }))
    .filter((i) => i.remaining > 0)

  // Nothing delivered and no returns yet -> hide the whole section
  if (deliveredSellerOrderIds.size === 0 && returns.length === 0) return null

  const toggleItem = (item) =>
    setQtyByItem((prev) => {
      const next = { ...prev }
      if (next[item.id]) delete next[item.id]
      else next[item.id] = 1
      return next
    })

  const setQty = (item, qty) =>
    setQtyByItem((prev) => ({ ...prev, [item.id]: Math.min(Math.max(1, qty), item.remaining) }))

  const selectedItems = eligibleItems.filter((i) => qtyByItem[i.id])
  const estimatedRefund = selectedItems.reduce(
    (sum, i) => sum + Number(i.unitPrice || 0) * qtyByItem[i.id],
    0
  )

  const submitReturn = async () => {
    if (selectedItems.length === 0) {
      setFormError('Select at least one item to return')
      return
    }
    if (new Set(selectedItems.map((i) => i.sellerOrderId)).size > 1) {
      setFormError('Items from different sellers must be returned in separate requests')
      return
    }
    if (reason === 'OTHER' && !note.trim()) {
      setFormError('Please describe the reason in the note')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const body = {
        orderId: order.id,
        reason,
        items: selectedItems.map((i) => ({ orderItemId: i.id, quantity: qtyByItem[i.id] })),
      }
      if (note.trim()) body.customerNote = note.trim()
      await apiRequest('/returns', { method: 'POST', body: JSON.stringify(body) })
      setShowForm(false)
      setQtyByItem({})
      setNote('')
      setReason('DEFECTIVE')
      await loadReturns()
    } catch (err) {
      setFormError(err?.message || 'Could not submit the return request')
    } finally {
      setSubmitting(false)
    }
  }

  const openAction = (type, id) => {
    setAction({ type, id })
    setActionNote('')
    setCarrierName('')
    setTrackingNumber('')
    setTrackingUrl('')
    setActionError('')
  }

  const closeAction = () => {
    setAction(null)
    setActionError('')
  }

  const runAction = async () => {
    if (!action) return
    setActionLoading(true)
    setActionError('')
    try {
      if (action.type === 'cancel') {
        const body = actionNote.trim() ? { note: actionNote.trim() } : {}
        await apiRequest(`/returns/${action.id}/cancel`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      }

      if (action.type === 'shipment') {
        if (carrierName.trim().length < 2 || trackingNumber.trim().length < 3) {
          throw new Error('Enter the courier name and the tracking number')
        }
        const body = { carrierName: carrierName.trim(), trackingNumber: trackingNumber.trim() }
        if (trackingUrl.trim()) body.trackingUrl = trackingUrl.trim()
        await apiRequest(`/returns/${action.id}/shipment`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      }

      if (action.type === 'escalate') {
        if (actionNote.trim().length < 3) {
          throw new Error('Please tell us why admin should review this return')
        }
        await apiRequest(`/returns/${action.id}/escalate`, {
          method: 'POST',
          body: JSON.stringify({ reason: actionNote.trim() }),
        })
      }

      closeAction()
      await loadReturns()
    } catch (err) {
      setActionError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#2864F0]'

  return (
    <section className="bg-white rounded-lg shadow-sm p-5 md:p-6 mt-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[#101A30]">Returns</h2>
        {!showForm && eligibleItems.length > 0 && (
          <button
            onClick={() => {
              setShowForm(true)
              setFormError('')
            }}
            className="text-[#2864F0] border border-[#2864F0]/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F0F0F8]"
          >
            Return Item
          </button>
        )}
      </div>

      {pageError && <p className="text-sm text-red-600 mb-3">{pageError}</p>}

      {/* New return request */}
      {showForm && (
        <div className="border border-gray-100 rounded-lg p-4 mb-5 space-y-4">
          <p className="text-sm font-medium text-[#101A30]">Select the items you want to return</p>

          <div className="space-y-3">
            {eligibleItems.map((item) => {
              const checked = Boolean(qtyByItem[item.id])
              return (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <label className="flex items-start gap-3 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#101A30]">
                        {item.productName}
                      </span>
                      {item.variantName && (
                        <span className="block text-xs text-[#52647D]">{item.variantName}</span>
                      )}
                      <span className="block text-xs text-[#52647D]">
                        {formatPrice(item.unitPrice)} each
                      </span>
                    </span>
                  </label>

                  {checked && item.remaining > 1 && (
                    <select
                      value={qtyByItem[item.id]}
                      onChange={(e) => setQty(item, Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white outline-none focus:border-[#2864F0]"
                    >
                      {Array.from({ length: item.remaining }, (_, n) => n + 1).map((n) => (
                        <option key={n} value={n}>
                          Qty {n}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#101A30] mb-1.5">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#101A30] mb-1.5">
              Note{' '}
              {reason === 'OTHER' ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-[#52647D] font-normal">(optional)</span>
              )}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Tell us what went wrong"
              className={`${inputCls} resize-none`}
            />
          </div>

          {selectedItems.length > 0 && (
            <p className="text-sm text-[#101A30]">
              Refund amount: <span className="font-semibold">{formatPrice(estimatedRefund)}</span>
            </p>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-3">
            <button
              onClick={submitReturn}
              disabled={submitting}
              className="bg-[#2864F0] text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setFormError('')
                setQtyByItem({})
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#52647D] border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* My returns for this order */}
      {loadingReturns ? (
        <p className="text-sm text-[#52647D]">Loading returns...</p>
      ) : returns.length === 0 ? (
        !showForm && <p className="text-sm text-[#52647D]">No return requests for this order.</p>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[#101A30] text-sm">{r.returnNumber}</p>
                  <p className="text-xs text-[#52647D] mt-0.5">
                    Requested on {formatDate(r.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    RETURN_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {formatStatus(r.status)}
                </span>
              </div>

              <p className="text-sm text-[#52647D] mt-2">
                Reason: {reasonLabel(r.reason)} · Refund: {formatPrice(r.refundAmount)}
              </p>
              {r.customerNote && (
                <p className="text-sm text-[#52647D] mt-1">Your note: {r.customerNote}</p>
              )}
              {r.sellerNote && (
                <p className="text-sm text-[#52647D] mt-1">Seller note: {r.sellerNote}</p>
              )}
              {r.trackingNumber && (
                <p className="text-sm text-[#52647D] mt-1">
                  Courier: {r.carrierName} - {r.trackingNumber}
                </p>
              )}
              {r.escalatedAt && (
                <p className="text-sm text-[#52647D] mt-1">Sent to admin for review.</p>
              )}
              {r.status === 'APPROVED' && !r.trackingNumber && (
                <p className="text-sm text-blue-700 mt-2">
                  Your return is approved. Please send the item back and add the courier details.
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {r.status === 'APPROVED' && !r.trackingNumber && (
                  <button
                    onClick={() => openAction('shipment', r.id)}
                    className="text-[#2864F0] border border-[#2864F0]/30 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#F0F0F8]"
                  >
                    Add courier details
                  </button>
                )}
                {r.status === 'REJECTED' && !r.escalatedAt && (
                  <button
                    onClick={() => openAction('escalate', r.id)}
                    className="text-[#2864F0] border border-[#2864F0]/30 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#F0F0F8]"
                  >
                    Ask admin to review
                  </button>
                )}
                {(r.status === 'REQUESTED' || r.status === 'APPROVED') && (
                  <button
                    onClick={() => openAction('cancel', r.id)}
                    className="text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50"
                  >
                    Cancel return
                  </button>
                )}
              </div>

              {/* Inline form for the chosen action */}
              {action && action.id === r.id && (
                <div className="mt-4 max-w-md space-y-3">
                  {action.type === 'shipment' ? (
                    <>
                      <input
                        value={carrierName}
                        onChange={(e) => setCarrierName(e.target.value)}
                        maxLength={100}
                        placeholder="Courier name"
                        className={inputCls}
                      />
                      <input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        maxLength={100}
                        placeholder="Tracking number"
                        className={inputCls}
                      />
                      <input
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        maxLength={500}
                        placeholder="Tracking link (optional)"
                        className={inputCls}
                      />
                    </>
                  ) : (
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder={
                        action.type === 'escalate'
                          ? 'Why should admin review this? (required)'
                          : 'Reason (optional)'
                      }
                      className={`${inputCls} resize-none`}
                    />
                  )}

                  {actionError && <p className="text-sm text-red-600">{actionError}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={runAction}
                      disabled={actionLoading}
                      className={`text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
                        action.type === 'cancel' ? 'bg-red-600' : 'bg-[#2864F0]'
                      }`}
                    >
                      {actionLoading ? 'Please wait...' : 'Confirm'}
                    </button>
                    <button
                      onClick={closeAction}
                      className="px-5 py-2 rounded-lg text-sm font-medium text-[#52647D] border border-gray-200"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function OrderDetails() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cancel order state
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const loadOrder = () => {
    return apiRequest(`/orders/${orderId}`)
      .then((res) => setOrder(res?.data ?? null))
      .catch((err) => setError(err?.message || 'Could not load this order'))
  }

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }
    setLoading(true)
    loadOrder().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const handleCancel = async () => {
    const trimmed = reason.trim()
    if (trimmed.length < 3 || trimmed.length > 500) {
      setCancelError('Reason must be between 3 and 500 characters')
      return
    }
    setCancelling(true)
    setCancelError('')
    try {
      await apiRequest(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: trimmed }),
      })
      setShowCancel(false)
      setReason('')
      await loadOrder()
    } catch (err) {
      setCancelError(err?.message || 'Could not cancel this order')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-[#52647D]">
        Loading order...
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
        <Link to="/orders" className="text-[#2864F0] font-medium">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  // Only order-level history (not seller-order history), oldest first
  const history = (order.orderStatusHistories || [])
    .filter((h) => !h.sellerOrderId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const items = order.orderItems || []
  const canCancel = order.status === 'PENDING_PAYMENT'

  // Shipments of all seller orders (one order can have several sellers)
  const shipments = (order.sellerOrders || [])
    .map((so) => so.shipment)
    .filter(Boolean)

  // NEW: payments of this order (empty for old orders)
  const payments = order.payments || []

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <Link to="/orders" className="text-sm text-[#2864F0] font-medium">
        ← Back to Orders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-5 md:p-6 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#101A30]">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-[#52647D] mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="self-start sm:self-auto bg-[#F0F0F8] text-[#2864F0] text-xs font-semibold px-3 py-1.5 rounded-full">
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mt-5">

        {/* Items */}
        <section className="md:col-span-2 bg-white rounded-lg shadow-sm p-5 md:p-6">
          <h2 className="text-lg font-semibold text-[#101A30] mb-4">Items</h2>

          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#101A30]">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-sm text-[#52647D]">{item.variantName}</p>
                  )}
                  <p className="text-xs text-[#52647D] mt-1">SKU: {item.sku}</p>
                  <p className="text-sm text-[#52647D] mt-1">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-[#101A30] shrink-0">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between font-semibold text-[#101A30]">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </section>

        {/* Right column: delivery address + payment */}
        <div className="space-y-5 h-fit">
          {/* Delivery address */}
          <section className="bg-white rounded-lg shadow-sm p-5 md:p-6">
            <h2 className="text-lg font-semibold text-[#101A30] mb-4">
              Delivery Address
            </h2>
            <p className="font-medium text-[#101A30]">{order.deliveryName}</p>
            <p className="text-sm text-[#52647D] mt-1">{order.deliveryPhone}</p>
            <p className="text-sm text-[#52647D] mt-2">
              {order.deliveryAddressLine1}
              {order.deliveryAddressLine2 ? `, ${order.deliveryAddressLine2}` : ''}
            </p>
            <p className="text-sm text-[#52647D]">
              {order.deliveryCity}, {order.deliveryState} - {order.deliveryPostalCode}
            </p>
            <p className="text-sm text-[#52647D]">{order.deliveryCountry}</p>
          </section>

          {/* NEW: Payment card (hidden when the order has no payment) */}
          {payments.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-5 md:p-6">
              <h2 className="text-lg font-semibold text-[#101A30] mb-4">Payment</h2>

              <div className="space-y-4">
                {payments.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[#101A30]">
                        {formatPaymentMethod(p.method)}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
                          paymentBadgeColors[p.status] ||
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {formatStatus(p.status)}
                      </span>
                    </div>
                    <p className="text-sm text-[#52647D] mt-1">
                      Amount: {formatPrice(p.amount)}
                    </p>
                    {p.method === 'COD' && p.status === 'PENDING' && (
                      <p className="text-xs text-[#52647D] mt-2">
                        Please pay in cash when your order is delivered.
                      </p>
                    )}
                    {p.method === 'COD' && p.status === 'CAPTURED' && (
                      <p className="text-xs text-green-700 mt-2">
                        Cash received. Thank you!
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Shipping */}
      <section className="bg-white rounded-lg shadow-sm p-5 md:p-6 mt-5">
        <h2 className="text-lg font-semibold text-[#101A30] mb-4">Shipping</h2>

        {shipments.length === 0 ? (
          <p className="text-sm text-[#52647D]">Not shipped yet.</p>
        ) : (
          <div className="space-y-8">
            {shipments.map((s) => (
              <ShipmentTimeline key={s.id} shipment={s} orderPlacedAt={order.createdAt} />
            ))}
          </div>
        )}
      </section>

      {/* Returns */}
      <ReturnsSection order={order} />

      {/* Status history */}
      <section className="bg-white rounded-lg shadow-sm p-5 md:p-6 mt-5">
        <h2 className="text-lg font-semibold text-[#101A30] mb-4">
          Order Status History
        </h2>

        <ol className="border-l-2 border-[#F0F0F8] ml-2 space-y-5">
          {history.map((h) => (
            <li key={h.id} className="pl-5 relative">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#2864F0]" />
              <p className="font-medium text-[#101A30]">
                {formatStatus(h.newStatus)}
              </p>
              {h.note && <p className="text-sm text-[#52647D]">{h.note}</p>}
              <p className="text-xs text-[#52647D] mt-0.5">
                {formatDate(h.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Cancel order */}
      {canCancel && (
        <section className="bg-white rounded-lg shadow-sm p-5 md:p-6 mt-5">
          {!showCancel ? (
            <button
              onClick={() => setShowCancel(true)}
              className="text-red-600 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              Cancel Order
            </button>
          ) : (
            <div className="max-w-md">
              <label className="block text-sm font-medium text-[#101A30] mb-2">
                Reason for cancellation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2864F0]"
                placeholder="Tell us why you want to cancel"
              />
              {cancelError && (
                <p className="text-sm text-red-600 mt-2">{cancelError}</p>
              )}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowCancel(false)
                    setCancelError('')
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#52647D] border border-gray-200"
                >
                  Keep Order
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default OrderDetails