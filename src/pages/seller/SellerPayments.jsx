import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import sellerService from '../../api/service/sellerService'
import {
  IndianRupee, CreditCard, Clock, XCircle,
  CheckCircle2, ChevronRight, TrendingUp,
} from 'lucide-react'

function fmt(amount) {
  if (amount == null) return '—'
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

const STATUS_COLOR = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  PENDING:         'bg-yellow-100 text-yellow-700',
  CONFIRMED:       'bg-blue-100   text-blue-700',
  PROCESSING:      'bg-purple-100 text-purple-700',
  SHIPPED:         'bg-indigo-100 text-indigo-700',
  DELIVERED:       'bg-green-100  text-green-700',
  CANCELLED:       'bg-red-100    text-red-700',
  REFUNDED:        'bg-gray-100   text-gray-600',
}

const PAYMENT_STATUS = {
  PENDING_PAYMENT: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700' },
  PENDING:         { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:       { label: 'Paid',             color: 'bg-green-100  text-green-700' },
  PROCESSING:      { label: 'Paid',             color: 'bg-green-100  text-green-700' },
  SHIPPED:         { label: 'Paid',             color: 'bg-green-100  text-green-700' },
  DELIVERED:       { label: 'Paid',             color: 'bg-green-100  text-green-700' },
  CANCELLED:       { label: 'Cancelled',        color: 'bg-red-100    text-red-700' },
  REFUNDED:        { label: 'Refunded',         color: 'bg-gray-100   text-gray-600' },
}

function SummaryCard({ icon: Icon, label, value, sub, iconBg }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-start gap-4 shadow-sm border border-gray-100">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-[#52647D]">{label}</p>
        <p className="text-2xl font-bold text-[#101A30] mt-0.5">{value}</p>
        {sub && <p className="text-xs text-[#52647D] mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const FILTERS = ['All', 'Paid', 'Awaiting Payment', 'Cancelled', 'Refunded']
const PER_PAGE = 10

export default function SellerPayments() {
  const [allOrders, setAllOrders] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [filter,    setFilter]    = useState('All')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)

  useEffect(() => {
    setLoading(true)
    sellerService.listOrders({ page: 1, limit: 100 })
      .then(res => setAllOrders(res?.data?.orders || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const PAID_STATUSES      = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const PENDING_STATUSES   = ['PENDING_PAYMENT', 'PENDING']
  const CANCELLED_STATUSES = ['CANCELLED', 'REFUNDED']

  const paidOrders       = allOrders.filter(o => PAID_STATUSES.includes(o.status))
  const pendingPayOrders = allOrders.filter(o => PENDING_STATUSES.includes(o.status))
  const cancelledOrders  = allOrders.filter(o => CANCELLED_STATUSES.includes(o.status))
  const deliveredOrders  = allOrders.filter(o => o.status === 'DELIVERED')

  const totalRevenue    = paidOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
  const pendingAmount   = pendingPayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
  const cancelledAmount = cancelledOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
  const collectionRate  = allOrders.length > 0
    ? Math.round((paidOrders.length / allOrders.length) * 100)
    : 0

  const filtered = allOrders
    .filter(o => {
      const ps = PAYMENT_STATUS[o.status]?.label || ''
      if (filter === 'All')              return true
      if (filter === 'Paid')             return ps === 'Paid'
      if (filter === 'Awaiting Payment') return ps === 'Awaiting Payment'
      if (filter === 'Cancelled')        return ps === 'Cancelled'
      if (filter === 'Refunded')         return ps === 'Refunded'
      return true
    })
    .filter(o => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        o.id.toLowerCase().includes(q) ||
        (o.order?.orderNumber || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#52647D]">Loading payments…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm">{error}</div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#101A30]">Payments</h1>
        <p className="text-sm text-[#52647D] mt-0.5">Track your revenue and order payment status</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={IndianRupee}  label="Total Revenue"       value={fmt(totalRevenue)}    sub={`${paidOrders.length} paid orders`}       iconBg="bg-[#2864F0]" />
        <SummaryCard icon={CheckCircle2} label="Collected"           value={fmt(totalRevenue)}    sub="Confirmed & delivered"                    iconBg="bg-green-500" />
        <SummaryCard icon={Clock}        label="Awaiting Payment"    value={fmt(pendingAmount)}   sub={`${pendingPayOrders.length} orders`}       iconBg="bg-yellow-500" />
        <SummaryCard icon={XCircle}      label="Cancelled / Refund"  value={fmt(cancelledAmount)} sub={`${cancelledOrders.length} orders`}       iconBg="bg-red-400" />
      </div>

      {/* Collection rate */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={17} className="text-[#2864F0]" />
          <h3 className="font-semibold text-[#101A30] text-sm">Collection Rate</h3>
          <span className="ml-auto text-sm font-bold text-[#2864F0]">{collectionRate}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2864F0] rounded-full transition-all duration-500"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#52647D] mt-2">
          <span>{paidOrders.length} paid</span>
          <span>{allOrders.length} total orders</span>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-[#2864F0] text-white'
                    : 'bg-[#F0F0F8] text-[#52647D] hover:bg-blue-50 hover:text-[#2864F0]'
                }`}
              >
                {f}
                {f === 'Paid'             && ` (${paidOrders.length})`}
                {f === 'Awaiting Payment' && ` (${pendingPayOrders.length})`}
                {f === 'Cancelled'        && ` (${cancelledOrders.filter(o => o.status === 'CANCELLED').length})`}
                {f === 'Refunded'         && ` (${allOrders.filter(o => o.status === 'REFUNDED').length})`}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by order ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#101A30] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2864F0]/30 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-[#101A30]">All Transactions</h3>
          <span className="text-xs text-[#52647D]">{filtered.length} records</span>
        </div>

        {paginated.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#52647D]">No transactions found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F0F0F8] text-[#52647D] text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-semibold">Order ID</th>
                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                    <th className="px-5 py-3 text-left font-semibold">Items</th>
                    <th className="px-5 py-3 text-left font-semibold">Order Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Payment Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                    <th className="px-5 py-3 text-center font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(o => {
                    const ps = PAYMENT_STATUS[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-600' }
                    return (
                      <tr key={o.id} className="hover:bg-[#F8F8FC] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[#101A30] font-medium">
                          #{o.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 text-[#52647D]">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5 text-[#52647D]">{o.items?.length ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ps.color}`}>
                            {ps.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-[#101A30]">
                          {fmt(o.totalAmount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Link
                            to={`/seller/orders/${o.id}`}
                            className="text-[#2864F0] hover:underline text-xs font-medium inline-flex items-center gap-1"
                          >
                            View <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginated.map(o => {
                const ps = PAYMENT_STATUS[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <Link
                    key={o.id}
                    to={`/seller/orders/${o.id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F0F0F8] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#101A30] font-mono">#{o.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-[#52647D] mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${ps.color}`}>
                        {ps.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#101A30]">{fmt(o.totalAmount)}</p>
                      <ChevronRight size={14} className="text-gray-300 mt-1 ml-auto" />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#F0F0F8] text-[#52647D] disabled:opacity-40 hover:bg-blue-50 hover:text-[#2864F0] transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-xs text-[#52647D]">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#F0F0F8] text-[#52647D] disabled:opacity-40 hover:bg-blue-50 hover:text-[#2864F0] transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}
