/**
 * Seller Shipments
 *
 * GET  /seller/shipments
 *   → { success, data: Shipment[] (each has events[], sellerOrder { order, items }) }
 *
 * POST /seller/shipments
 *   body: { sellerOrderId, carrierName, trackingNumber, trackingUrl?, estimatedDeliveryAt? }
 *   → { success, data: Shipment }
 *
 * PATCH /seller/shipments/:shipmentId/status
 *   body: { status, description? }
 *   → { success, data: Shipment }
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { Truck, Plus, ChevronDown, ChevronUp, X, Save } from 'lucide-react'

const SHIPMENT_STATUS_COLOR = {
  READY_TO_SHIP:     'bg-yellow-100  text-yellow-700',
  PACKED:            'bg-blue-100    text-blue-700',
  SHIPPED:           'bg-indigo-100  text-indigo-700',
  IN_TRANSIT:        'bg-purple-100  text-purple-700',
  OUT_FOR_DELIVERY:  'bg-orange-100  text-orange-700',
  DELIVERED:         'bg-green-100   text-green-700',
  DELIVERY_FAILED:   'bg-red-100     text-red-700',
  RETURN_TO_ORIGIN:  'bg-gray-100    text-gray-600',
}

/* allowed next statuses per current status */
const NEXT_SHIP_STATUS = {
  READY_TO_SHIP:    ['PACKED', 'SHIPPED'],
  PACKED:           ['SHIPPED'],
  SHIPPED:          ['IN_TRANSIT', 'DELIVERY_FAILED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'RETURN_TO_ORIGIN'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'RETURN_TO_ORIGIN'],
  DELIVERY_FAILED:  ['IN_TRANSIT', 'RETURN_TO_ORIGIN'],
  DELIVERED:        [],
  RETURN_TO_ORIGIN: [],
}

function fmt(v) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function SellerShipments() {
  const [shipments, setShipments] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  /* expanded detail row */
  const [expanded, setExpanded] = useState(null)

  /* update status form */
  const [updating,     setUpdating]     = useState(null) // shipmentId
  const [updateForm,   setUpdateForm]   = useState({ status: '', description: '' })
  const [updateLoading,setUpdateLoading]= useState(false)
  const [updateError,  setUpdateError]  = useState('')

  useEffect(() => { fetchShipments() }, [])

  const fetchShipments = () => {
    setLoading(true)
    sellerService.listShipments()
      .then(res => setShipments(res?.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleUpdateStatus = async (shipmentId) => {
    if (!updateForm.status) return
    setUpdateLoading(true)
    setUpdateError('')
    try {
      const payload = { status: updateForm.status }
      if (updateForm.description) payload.description = updateForm.description
      const res = await sellerService.updateShipmentStatus(shipmentId, payload)
      setShipments(prev => prev.map(s => s.id === shipmentId ? res?.data : s))
      setUpdating(null)
      setUpdateForm({ status: '', description: '' })
    } catch (err) {
      setUpdateError(err.message)
    } finally {
      setUpdateLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">{error}</div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#101A30]">Shipments</h2>
        <span className="text-sm text-[#52647D]">{shipments.length} total</span>
      </div>

      {shipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Truck size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-[#52647D]">No shipments yet.</p>
          <p className="text-xs text-[#52647D] mt-1">Shipments are created from Order Details when processing an order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map(ship => {
            const isExpanded = expanded === ship.id
            const isUpdating = updating === ship.id
            const nextStatuses = NEXT_SHIP_STATUS[ship.status] || []
            const orderNum = ship.sellerOrder?.order?.orderNumber || ship.sellerOrderId?.slice(-8).toUpperCase()

            return (
              <div key={ship.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Row header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#2864F0]/10 flex items-center justify-center shrink-0">
                      <Truck size={18} className="text-[#2864F0]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#101A30] text-sm">
                        {ship.carrierName} · <span className="font-mono">{ship.trackingNumber}</span>
                      </p>
                      <p className="text-xs text-[#52647D] mt-0.5">
                        Order: #{orderNum}
                        {ship.sellerOrder?.items?.length ? ` · ${ship.sellerOrder.items.length} item(s)` : ''}
                        {ship.sellerOrder?.totalAmount ? ` · ${fmt(ship.sellerOrder.totalAmount)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${SHIPMENT_STATUS_COLOR[ship.status] || 'bg-gray-100 text-gray-600'}`}>
                      {ship.status?.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : ship.id)}
                      className="text-gray-400 hover:text-[#2864F0] p-1"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">

                    {/* Shipment meta */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-[#52647D] font-semibold mb-0.5">Carrier</p>
                        <p className="text-[#101A30]">{ship.carrierName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#52647D] font-semibold mb-0.5">Tracking No.</p>
                        <p className="font-mono text-[#101A30]">{ship.trackingNumber}</p>
                      </div>
                      {ship.trackingUrl && (
                        <div>
                          <p className="text-xs text-[#52647D] font-semibold mb-0.5">Track Online</p>
                          <a href={ship.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2864F0] hover:underline">
                            Track →
                          </a>
                        </div>
                      )}
                      {ship.estimatedDeliveryAt && (
                        <div>
                          <p className="text-xs text-[#52647D] font-semibold mb-0.5">Est. Delivery</p>
                          <p className="text-[#101A30]">{new Date(ship.estimatedDeliveryAt).toLocaleDateString('en-IN')}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-[#52647D] font-semibold mb-0.5">Created</p>
                        <p className="text-[#101A30]">{new Date(ship.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Order items */}
                    {ship.sellerOrder?.items?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#52647D] uppercase tracking-wide mb-2">Items</p>
                        <div className="space-y-1.5">
                          {ship.sellerOrder.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                              <div>
                                <span className="font-medium text-[#101A30]">{item.productName}</span>
                                {item.variantName && <span className="text-[#52647D] ml-2 text-xs">{item.variantName}</span>}
                              </div>
                              <div className="text-right text-xs text-[#52647D]">
                                {item.quantity} × {fmt(item.unitPrice)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipment events timeline */}
                    {ship.events?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#52647D] uppercase tracking-wide mb-2">Tracking History</p>
                        <div className="space-y-2">
                          {ship.events.map((ev, i) => (
                            <div key={ev.id || i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#2864F0] mt-1.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-[#101A30]">{ev.status?.replace(/_/g, ' ')}</p>
                                {ev.description && <p className="text-xs text-[#52647D]">{ev.description}</p>}
                                <p className="text-[10px] text-gray-400">{new Date(ev.createdAt).toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Update status */}
                    {nextStatuses.length > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        {!isUpdating ? (
                          <button
                            onClick={() => { setUpdating(ship.id); setUpdateForm({ status: '', description: '' }); setUpdateError('') }}
                            className="flex items-center gap-2 text-sm text-[#2864F0] font-semibold hover:underline"
                          >
                            <Truck size={14} /> Update Shipment Status
                          </button>
                        ) : (
                          <div className="space-y-3">
                            {updateError && (
                              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{updateError}</p>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#101A30] mb-1">New Status</label>
                                <select
                                  value={updateForm.status}
                                  onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#2864F0]"
                                >
                                  <option value="">Select status</option>
                                  {nextStatuses.map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#101A30] mb-1">Note (optional)</label>
                                <input
                                  type="text"
                                  value={updateForm.description}
                                  onChange={e => setUpdateForm(f => ({ ...f, description: e.target.value }))}
                                  maxLength={500}
                                  placeholder="e.g. Reached hub"
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2864F0]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(ship.id)}
                                disabled={updateLoading || !updateForm.status}
                                className="flex items-center gap-2 bg-[#2864F0] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#2878C8] disabled:opacity-60"
                              >
                                <Save size={13} />
                                {updateLoading ? 'Saving…' : 'Update'}
                              </button>
                              <button
                                onClick={() => setUpdating(null)}
                                className="flex items-center gap-2 border border-gray-200 text-[#101A30] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50"
                              >
                                <X size={13} /> Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {nextStatuses.length === 0 && (
                      <p className="text-xs text-[#52647D] italic">
                        {ship.status === 'DELIVERED' ? '✓ Delivered — no further updates needed.' : 'No further status updates available.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SellerShipments
