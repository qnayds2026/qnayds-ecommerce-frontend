/**
 * Seller Orders List
 *
 * GET /seller/orders?page=&limit=&status=
 *   → { success, data: { orders: SellerOrder[], pagination: { page, limit, total, totalPages } } }
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_COLOR = {
  PENDING_PAYMENT: 'bg-gray-100    text-gray-600',
  PENDING:         'bg-yellow-100  text-yellow-700',
  CONFIRMED:       'bg-blue-100    text-blue-700',
  PROCESSING:      'bg-purple-100  text-purple-700',
  SHIPPED:         'bg-indigo-100  text-indigo-700',
  DELIVERED:       'bg-green-100   text-green-700',
  CANCELLED:       'bg-red-100     text-red-700',
  REFUNDED:        'bg-gray-100    text-gray-600',
}

function fmt(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function SellerOrders() {
  const [orders,     setOrders]     = useState([])
  const [pagination, setPagination] = useState({ page:1, limit:10, total:0, totalPages:1 })
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchOrders(1) }, [statusFilter])

  const fetchOrders = page => {
    setLoading(true)
    sellerService.listOrders({ page, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) })
      .then(res => {
        setOrders(res?.data?.orders || [])
        setPagination(res?.data?.pagination || { page:1, limit:10, total:0, totalPages:1 })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#101A30]">Orders</h2>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#2864F0]">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLOR).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[#52647D]">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order ID','Date','Items','Amount','Status','Action'].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-[#52647D] uppercase tracking-wide ${i===5?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-[#F0F0F8] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#101A30]">#{o.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3 text-xs text-[#52647D] whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-[#52647D]">{o.items?.length ?? '—'}</td>
                    <td className="px-5 py-3 font-semibold text-[#101A30]">{fmt(o.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[o.status]||'bg-gray-100 text-gray-600'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/seller/orders/${o.id}`} className="text-xs text-[#2864F0] font-semibold hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-[#52647D]">{orders.length} of {pagination.total} orders</p>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchOrders(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-[#52647D] hover:border-[#2864F0] hover:text-[#2864F0] disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-[#52647D]">Page {pagination.page} of {pagination.totalPages}</span>
              <button onClick={() => fetchOrders(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-[#52647D] hover:border-[#2864F0] hover:text-[#2864F0] disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerOrders
