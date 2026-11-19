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