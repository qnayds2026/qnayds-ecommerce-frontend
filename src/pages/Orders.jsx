import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Search } from 'lucide-react'
import { apiRequest } from '../services/api'

// Dot colour for each status (unknown statuses use blue)
const statusDot = {
  PENDING_PAYMENT: 'bg-yellow-500',
  CONFIRMED: 'bg-[#2864F0]',
  PROCESSING: 'bg-[#2864F0]',
  SHIPPED: 'bg-[#2864F0]',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  REFUNDED: 'bg-gray-500',
}

// Flipkart-style status filters mapped to backend OrderStatus values
const STATUS_FILTERS = [
  { key: 'ontheway', label: 'On the way', statuses: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] },
  { key: 'delivered', label: 'Delivered', statuses: ['DELIVERED'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
  { key: 'returned', label: 'Returned', statuses: ['REFUNDED'] },
]

const PAYMENT_FILTERS = [
  { key: 'ONLINE', label: 'Online' },
  { key: 'COD', label: 'COD' },
]

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

// Example: Nov 08, 2024
function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

// Payment method of the latest payment attempt (needs order.payments from API)
function getPaymentMethod(order) {
  const payments = order.payments
  if (!Array.isArray(payments) || payments.length === 0) return null
  return payments[payments.length - 1].method || null
}

// Date when the order reached a status (from order-level status history)
function getStatusDate(order, status) {
  const entries = (order.orderStatusHistories || [])
    .filter((h) => !h.sellerOrderId && h.newStatus === status)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return entries[0]?.createdAt || order.updatedAt
}

// Title and message shown on the right side of each row
function getStatusInfo(order) {
  switch (order.status) {
    case 'DELIVERED':
      return {
        title: `Delivered on ${formatDate(getStatusDate(order, 'DELIVERED'))}`,
        message: 'Your item has been delivered',
      }
    case 'CANCELLED':
      return {
        title: `Cancelled on ${formatDate(getStatusDate(order, 'CANCELLED'))}`,
        message: 'Your order was cancelled as per your request.',
      }
    case 'REFUNDED':
      return {
        title: `Refunded on ${formatDate(getStatusDate(order, 'REFUNDED'))}`,
        message: 'Your refund has been processed',
      }
    case 'SHIPPED':
      return { title: 'Shipped', message: 'Your item is on the way' }
    case 'PROCESSING':
      return { title: 'Processing', message: 'Your order is being prepared' }
    case 'CONFIRMED':
      return {
        title: `Confirmed on ${formatDate(getStatusDate(order, 'CONFIRMED'))}`,
        message: 'Your order has been confirmed',
      }
    default:
      return {
        title: `Ordered on ${formatDate(order.createdAt)}`,
        message: 'Waiting for payment',
      }
  }
}

function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search and filters
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [selectedTimes, setSelectedTimes] = useState([])
  const [selectedPayments, setSelectedPayments] = useState([])

  const currentYear = new Date().getFullYear()
  const timeFilters = [
    { key: 'last30', label: 'Last 30 days' },
    { key: String(currentYear), label: String(currentYear) },
    { key: String(currentYear - 1), label: String(currentYear - 1) },
    { key: 'older', label: 'Older' },
  ]

  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return
    }

    apiRequest('/orders')
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.orders || res.data?.items || []
        setOrders(list)
      })
      .catch((err) => setError(err.message || 'Could not load orders'))
      .finally(() => setLoading(false))
  }, [navigate])

  // Show the Payment filter only when the API sends payment data
  const hasPaymentData = orders.some((o) => getPaymentMethod(o))

  const toggle = (list, setList, value) => {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    )
  }

  const matchesStatus = (order) => {
    if (selectedStatuses.length === 0) return true
    return STATUS_FILTERS.some(
      (f) => selectedStatuses.includes(f.key) && f.statuses.includes(order.status)
    )
  }

  const matchesTime = (order) => {
    if (selectedTimes.length === 0) return true
    const created = new Date(order.createdAt)
    const year = created.getFullYear()
    return selectedTimes.some((t) => {
      if (t === 'last30') {
        const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= 30
      }
      if (t === 'older') return year < currentYear - 1
      return String(year) === t
    })
  }

  const matchesPayment = (order) => {
    if (selectedPayments.length === 0) return true
    return selectedPayments.includes(getPaymentMethod(order))
  }

  const matchesQuery = (order) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    const inNumber = (order.orderNumber || '').toLowerCase().includes(q)
    const inItems = (order.orderItems || []).some((item) =>
      (item.productName || '').toLowerCase().includes(q)
    )
    return inNumber || inItems
  }

  const filteredOrders = orders.filter(
    (order) =>
      matchesStatus(order) &&
      matchesTime(order) &&
      matchesPayment(order) &&
      matchesQuery(order)
  )

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(searchText)
  }

  const checkboxLabel =
    'flex items-center gap-3 text-sm text-[#101A30] mb-2 cursor-pointer'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F0F0F8]">
        <p className="text-[#52647D]">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#F0F0F8] min-h-screen py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <p className="text-xs text-[#52647D] mb-4">
          <Link to="/" className="hover:text-[#2864F0]">Home</Link>
          {' > '}
          <Link to="/customer" className="hover:text-[#2864F0]">My Account</Link>
          {' > '}
          <span>My Orders</span>
        </p>

        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* Filters */}
          <aside className="w-full md:w-64 shrink-0 bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-[#101A30] px-5 py-4 border-b border-gray-100">
              Filters
            </h2>

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-[#101A30] mb-3">
                ORDER STATUS
              </p>
              {STATUS_FILTERS.map((f) => (
                <label key={f.key} className={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(f.key)}
                    onChange={() =>
                      toggle(selectedStatuses, setSelectedStatuses, f.key)
                    }
                    className="w-4 h-4 accent-[#2864F0]"
                  />
                  {f.label}
                </label>
              ))}
            </div>

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-[#101A30] mb-3">
                ORDER TIME
              </p>
              {timeFilters.map((f) => (
                <label key={f.key} className={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTimes.includes(f.key)}
                    onChange={() => toggle(selectedTimes, setSelectedTimes, f.key)}
                    className="w-4 h-4 accent-[#2864F0]"
                  />
                  {f.label}
                </label>
              ))}
            </div>

            {hasPaymentData && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-[#101A30] mb-3">
                  PAYMENT
                </p>
                {PAYMENT_FILTERS.map((f) => (
                  <label key={f.key} className={checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(f.key)}
                      onChange={() =>
                        toggle(selectedPayments, setSelectedPayments, f.key)
                      }
                      className="w-4 h-4 accent-[#2864F0]"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            )}
          </aside>

          {/* Orders */}
          <div className="flex-1 w-full min-w-0">
            <form onSubmit={handleSearch} className="flex mb-5">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search your orders here"
                className="flex-1 min-w-0 px-4 py-3 bg-white border border-gray-200 rounded-l-lg outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-[#2864F0] text-white px-5 rounded-r-lg hover:bg-[#2878C8] flex items-center gap-2 text-sm font-medium"
              >
                <Search size={18} />
                <span className="hidden sm:inline">Search Orders</span>
              </button>
            </form>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {!error && orders.length === 0 && (
              <div className="bg-white rounded-xl p-10 text-center">
                <div className="text-5xl mb-3">📦</div>
                <h2 className="text-xl font-semibold text-[#101A30]">No orders yet</h2>
                <Link
                  to="/"
                  className="inline-block mt-4 bg-[#2864F0] text-white px-6 py-3 rounded-lg"
                >
                  Start Shopping
                </Link>
              </div>
            )}

            {orders.length > 0 && filteredOrders.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center text-[#52647D]">
                No orders match your search or filters.
              </div>
            )}

            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const info = getStatusInfo(order)
                return (order.orderItems || []).map((item) => (
                  <Link
                    key={item.id}
                    to={`/orders/${order.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 md:p-5 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                      {/* Image placeholder (no image in the order API) */}
                      <div className="w-24 h-24 shrink-0 rounded bg-[#F0F0F8] flex items-center justify-center text-[#52647D]">
                        <Package size={36} strokeWidth={1.5} />
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#101A30] truncate">
                          {item.productName || 'Item'}
                        </p>
                        {item.variantName && (
                          <p className="text-sm text-[#52647D] mt-1">
                            {item.variantName}
                          </p>
                        )}
                        {item.quantity > 1 && (
                          <p className="text-sm text-[#52647D] mt-1">
                            Qty: {item.quantity}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <p className="text-[#101A30] sm:w-28">
                        {formatPrice(item.subtotal)}
                      </p>

                      {/* Status */}
                      <div className="sm:w-72">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              statusDot[order.status] || 'bg-[#2864F0]'
                            }`}
                          />
                          <p className="font-semibold text-[#101A30] text-sm">
                            {info.title}
                          </p>
                        </div>
                        <p className="text-xs text-[#52647D] mt-2">
                          {info.message}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Orders