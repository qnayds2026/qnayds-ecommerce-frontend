/**
 * Seller Order Details
 *
 * GET  /seller/orders/:orderId
 *   → { success, data: SellerOrder with order, items[], shipment, statusHistory[] }
 *
 * PATCH /seller/orders/:orderId/status
 *   body: { status: string, note?: string }
 *
 * POST  /seller/orders/:orderId/shipment
 *   body: { carrierName, trackingNumber, trackingUrl? }
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, Package, MapPin, Clock } from 'lucide-react'

const STATUS_COLOR = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100   text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED:    'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100  text-green-700',
  CANCELLED:  'bg-red-100    text-red-700',
  REFUNDED:   'bg-gray-100   text-gray-600',
}

/* seller-allowed next statuses via the status endpoint
   NOTE: SHIPPED is NOT allowed here — only via POST /shipment which also
   auto-transitions the order. Backend transition table from order-status.js:
   PENDING_PAYMENT → CONFIRMED | CANCELLED
   CONFIRMED       → PROCESSING | CANCELLED
   PROCESSING      → CANCELLED  (SHIPPED happens via shipment creation)
   SHIPPED         → DELIVERED
   DELIVERED       → REFUNDED
*/
const NEXT_STATUS = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  PENDING:         ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:       ['PROCESSING', 'CANCELLED'],
  PROCESSING:      ['CANCELLED'],
  SHIPPED:         ['DELIVERED'],
  DELIVERED:       ['REFUNDED'],
  CANCELLED:       [],
  REFUNDED:        [],
}

function fmt(v) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function SellerOrderDetails() {
  const { orderId } = useParams()
  const navigate    = useNavigate()

  const [order,       setOrder]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  /* status update form */
  const [statusForm,    setStatusForm]    = useState({ status:'', note:'' })
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError,   setStatusError]   = useState('')
  const [statusSuccess, setStatusSuccess] = useState('')

  /* shipment form */
  const [shipForm,    setShipForm]    = useState({ carrierName:'', trackingNumber:'', trackingUrl:'' })
  const [shipLoading, setShipLoading] = useState(false)
  const [shipError,   setShipError]   = useState('')
  const [shipSuccess, setShipSuccess] = useState('')
  const [showShipForm,setShowShipForm]= useState(false)

  useEffect(() => { fetchOrder() }, [orderId])

  const fetchOrder = () => {
    setLoading(true)
    sellerService.getOrder(orderId)
      .then(res => setOrder(res?.data || null))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleStatusUpdate = async e => {
    e.preventDefault()
    setStatusLoading(true); setStatusError(''); setStatusSuccess('')
    try {
      const payload = { status: statusForm.status }
      if (statusForm.note) payload.note = statusForm.note
      const res = await sellerService.updateOrderStatus(orderId, payload)
      setOrder(res?.data)
      setStatusForm({ status:'', note:'' })
      setStatusSuccess('Order status updated successfully.')
    } catch (err) {
      setStatusError(err.message)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleCreateShipment = async e => {
    e.preventDefault()
    setShipLoading(true); setShipError(''); setShipSuccess('')
    try {
      const payload = { carrierName: shipForm.carrierName, trackingNumber: shipForm.trackingNumber }
      if (shipForm.trackingUrl) payload.trackingUrl = shipForm.trackingUrl
      const res = await sellerService.createOrderShipment(orderId, payload)
      setShipSuccess(`Shipment created! Tracking: ${res?.data?.trackingNumber}`)
      setShowShipForm(false)
      fetchOrder()
    } catch (err) {
      setShipError(err.message)
    } finally {
      setShipLoading(false)
    }
  }

  /* ── loading / error ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error)  return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">{error}</div>
  if (!order) return null

  const nextStatuses = NEXT_STATUS[order.status] || []
  const canShip      = ['CONFIRMED', 'PROCESSING'].includes(order.status) && !order.shipment
  const parentOrder  = order.order

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/seller/orders')} className="text-[#52647D] hover:text-[#2864F0] p-1 rounded-lg hover:bg-blue-50 mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#101A30]">Order #{order.id.slice(-8).toUpperCase()}</h2>
          <p className="text-xs text-[#52647D] mt-0.5">
            Placed {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLOR[order.status]||'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>

      {statusSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-3 text-sm">{statusSuccess}</div>}
      {shipSuccess   && <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-3 text-sm">{shipSuccess}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Left: items + shipment */}
        <div className="md:col-span-2 space-y-5">

          {/* Order items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Package size={16} className="text-[#2864F0]" />
              <h3 className="font-semibold text-[#101A30]">Order Items</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {(order.items || []).map(item => (
                <div key={item.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#101A30] text-sm">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-[#52647D] mt-0.5">{item.variantName}</p>}
                    <p className="text-xs text-[#52647D] mt-0.5 font-mono">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#101A30]">{fmt(item.subtotal)}</p>
                    <p className="text-xs text-[#52647D]">{item.quantity} × {fmt(item.unitPrice)}</p>
                  </div>
                </div>
              ))}
              <div className="px-5 py-4 flex items-center justify-between bg-gray-50">
                <span className="font-semibold text-[#101A30]">Order Total</span>
                <span className="text-lg font-bold text-[#2864F0]">{fmt(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipment */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Truck size={16} className="text-[#2864F0]" />
              <h3 className="font-semibold text-[#101A30]">Shipment</h3>
            </div>
            <div className="px-5 py-4">
              {order.shipment ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-[#52647D] font-semibold mb-1">Carrier</p><p className="text-[#101A30]">{order.shipment.carrierName}</p></div>
                  <div><p className="text-xs text-[#52647D] font-semibold mb-1">Tracking No.</p><p className="font-mono text-[#101A30]">{order.shipment.trackingNumber}</p></div>
                  <div>
                    <p className="text-xs text-[#52647D] font-semibold mb-1">Status</p>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{order.shipment.status}</span>
                  </div>
                  {order.shipment.trackingUrl && (
                    <div>
                      <p className="text-xs text-[#52647D] font-semibold mb-1">Track Online</p>
                      <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2864F0] hover:underline">
                        Track Package →
                      </a>
                    </div>
                  )}
                </div>
              ) : canShip ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#52647D]">Order is in {order.status}. Add tracking details to mark it as Shipped.</p>
                  {!showShipForm ? (
                    <button onClick={() => setShowShipForm(true)}
                      className="flex items-center gap-2 bg-[#2864F0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2878C8]">
                      <Truck size={14} /> Create Shipment
                    </button>
                  ) : (
                    <form onSubmit={handleCreateShipment} className="space-y-3">
                      {shipError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{shipError}</p>}
                      <div>
                        <label className="block text-xs font-semibold text-[#101A30] mb-1">Carrier Name <span className="text-red-500">*</span></label>
                        <input type="text" value={shipForm.carrierName} onChange={e => setShipForm(f=>({...f,carrierName:e.target.value}))}
                          required minLength={2} maxLength={100} placeholder="e.g. Delhivery, Bluedart"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#101A30] mb-1">Tracking Number <span className="text-red-500">*</span></label>
                        <input type="text" value={shipForm.trackingNumber} onChange={e => setShipForm(f=>({...f,trackingNumber:e.target.value}))}
                          required minLength={2} maxLength={100} placeholder="e.g. DEL1234567890"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#101A30] mb-1">Tracking URL (optional)</label>
                        <input type="url" value={shipForm.trackingUrl} onChange={e => setShipForm(f=>({...f,trackingUrl:e.target.value}))}
                          placeholder="https://…"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={shipLoading}
                          className="bg-[#2864F0] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#2878C8] disabled:opacity-60">
                          {shipLoading ? 'Creating…' : 'Create Shipment'}
                        </button>
                        <button type="button" onClick={() => setShowShipForm(false)}
                          className="border border-gray-200 text-[#101A30] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#52647D]">
                  {['DELIVERED','CANCELLED'].includes(order.status)
                    ? 'No shipment data.'
                    : 'Shipment can be created once the order is in Processing status.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: address + status update + history */}
        <div className="space-y-5">

          {/* Delivery address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <MapPin size={16} className="text-[#2864F0]" />
              <h3 className="font-semibold text-[#101A30]">Delivery Address</h3>
            </div>
            <div className="px-5 py-4 text-sm space-y-0.5">
              {parentOrder ? (
                <>
                  <p className="font-semibold text-[#101A30]">{parentOrder.deliveryName}</p>
                  <p className="text-[#52647D]">{parentOrder.deliveryAddressLine1}</p>
                  {parentOrder.deliveryAddressLine2 && <p className="text-[#52647D]">{parentOrder.deliveryAddressLine2}</p>}
                  <p className="text-[#52647D]">
                    {[parentOrder.deliveryCity, parentOrder.deliveryState, parentOrder.deliveryPostalCode].filter(Boolean).join(', ')}
                  </p>
                  {parentOrder.deliveryCountry && <p className="text-[#52647D]">{parentOrder.deliveryCountry}</p>}
                  {parentOrder.deliveryPhone   && <p className="text-[#52647D]">{parentOrder.deliveryPhone}</p>}
                </>
              ) : (
                <p className="text-[#52647D]">No address info available.</p>
              )}
            </div>
          </div>

          {/* Update status */}
          {nextStatuses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <Clock size={16} className="text-[#2864F0]" />
                <h3 className="font-semibold text-[#101A30]">Update Status</h3>
              </div>
              <div className="px-5 py-4">
                {statusError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">{statusError}</p>}
                <form onSubmit={handleStatusUpdate} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#101A30] mb-1">New Status</label>
                    <select value={statusForm.status} onChange={e => setStatusForm(f=>({...f,status:e.target.value}))} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#2864F0]">
                      <option value="">Select status</option>
                      {nextStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#101A30] mb-1">Note (optional)</label>
                    <textarea value={statusForm.note} onChange={e => setStatusForm(f=>({...f,note:e.target.value}))}
                      rows={2} maxLength={500} placeholder="Add a note…"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2864F0] resize-none" />
                  </div>
                  <button type="submit" disabled={statusLoading || !statusForm.status}
                    className="w-full bg-[#2864F0] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#2878C8] disabled:opacity-60">
                    {statusLoading ? 'Updating…' : 'Update Status'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-[#101A30]">Status History</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {order.statusHistory.map((h, i) => (
                  <div key={h.id || i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2864F0] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#101A30]">
                        {h.fromStatus ? `${h.fromStatus} → ` : ''}{h.toStatus || h.newStatus}
                      </p>
                      {(h.note || h.reason) && <p className="text-xs text-[#52647D]">{h.note || h.reason}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(h.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerOrderDetails
