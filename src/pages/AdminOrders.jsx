// File: src/pages/AdminOrders.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

// Status filter tabs (value '' means all orders)
const tabs = [
  { value: '', label: 'All' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
]

const badgeColors = {
  PENDING_PAYMENT: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-700 border-gray-200',
}

// Payment status badge colors
const paymentBadgeColors = {
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  CAPTURED: 'bg-green-50 text-green-700 border-green-200',
}

const PAGE_SIZE = 10

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// totalAmount comes as a string from the API
function formatAmount(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return `₹${n.toLocaleString('en-IN')}`
}

function formatStatus(status) {
  return (status || '').replace(/_/g, ' ')
}

// Unique shop names from sellerOrders (one order can have many sellers)
function getSellerNames(order) {
  const names = (order.sellerOrders || [])
    .map((so) => so.seller?.shopName)
    .filter(Boolean)
  return [...new Set(names)].join(', ') || '-'
}

// Pending COD payment of an order (null if there is none)
function getPendingCodPayment(order) {
  return (
    (order.payments || []).find(
      (p) => p.method === 'COD' && p.status === 'PENDING'
    ) || null
  )
}

function AdminOrders() {
  const [activeTab, setActiveTab] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  // Payment id that is currently being marked as collected
  const [collectingId, setCollectingId] = useState('')
  // Change this number to reload the list
  const [reloadKey, setReloadKey] = useState(0)

  // Load orders whenever status tab, search text, page or reloadKey changes
  useEffect(() => {
    let cancelled = false

    async function loadOrders() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(PAGE_SIZE))
        if (activeTab) params.set('status', activeTab)
        if (search) params.set('search', search)

        const res = await apiRequest(`/admin/orders?${params.toString()}`)
        if (!cancelled) {
          // This API returns data.orders and data.pagination
          setOrders(res.data?.orders || [])
          setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      cancelled = true
    }
  }, [activeTab, search, page, reloadKey])

  const handleTabChange = (value) => {
    setActiveTab(value)
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  // Mark a COD payment as collected (only for DELIVERED orders)
  const handleCollectCash = async (order, payment) => {
    const ok = window.confirm(
      `Mark cash collected for order ${order.orderNumber} (${formatAmount(
        payment.amount
      )})?`
    )
    if (!ok) return

    try {
      setCollectingId(payment.id)
      setError('')
      setSuccessMessage('')

      await apiRequest(`/payments/${payment.id}/cod/collect`, { method: 'POST' })

      setSuccessMessage(`Cash collected for order ${order.orderNumber}.`)
      // Reload the list to show the updated payment status
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err.message || 'Could not mark cash as collected')
    } finally {
      setCollectingId('')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Orders</h2>
      <p className="text-sm text-[#52647D] mt-1">
        View all customer orders. ({pagination.total} total)
      </p>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.value
                ? 'bg-[#2864F0] text-white'
                : 'bg-white text-[#101A30] hover:bg-[#E4E4F2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search box */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search orders"
          className="w-full max-w-sm px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#101A30] focus:outline-none focus:border-[#2864F0]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#101A30] hover:bg-[#E4E4F2] transition"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
          {successMessage}
        </div>
      )}

      <div className="mt-5 bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-6 text-[#52647D]">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-[#52647D]">No orders found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order #</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = (order.orderItems || []).reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0
                )
                const payment = (order.payments || [])[0] || null
                const pendingCod = getPendingCodPayment(order)
                const canCollect = order.status === 'DELIVERED' && pendingCod

                return (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4 font-semibold text-[#101A30] whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#101A30]">{order.user?.name || '-'}</p>
                      <p className="text-xs text-[#52647D]">{order.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-[#101A30]">{getSellerNames(order)}</td>
                    <td className="px-6 py-4 text-[#52647D]">{itemCount}</td>
                    <td className="px-6 py-4 text-[#101A30]">
                      {formatAmount(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      {payment ? (
                        <div>
                          <p className="text-[#101A30] font-medium">{payment.method}</p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                              paymentBadgeColors[payment.status] ||
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {formatStatus(payment.status)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#52647D]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
                          badgeColors[order.status] || ''
                        }`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#52647D]">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {canCollect ? (
                        <button
                          onClick={() => handleCollectCash(order, pendingCod)}
                          disabled={collectingId === pendingCod.id}
                          className="px-3 py-2 rounded-lg text-xs font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition whitespace-nowrap disabled:opacity-50"
                        >
                          {collectingId === pendingCod.id
                            ? 'Saving...'
                            : 'Mark cash collected'}
                        </button>
                      ) : (
                        <span className="text-[#52647D]">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#52647D]">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#101A30] hover:bg-[#E4E4F2] transition disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders