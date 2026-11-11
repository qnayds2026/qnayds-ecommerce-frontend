// File: src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

const ORDER_STATUSES = [
  { value: 'PENDING_PAYMENT', label: 'Pending Payment', color: 'bg-yellow-400' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-400' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-indigo-400' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-400' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-400' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-gray-400' },
]

const USER_ROLES = [
  { value: 'CUSTOMER', label: 'Customers', color: 'bg-blue-500' },
  { value: 'SELLER', label: 'Sellers', color: 'bg-green-500' },
  { value: 'ADMIN', label: 'Admins', color: 'bg-purple-500' },
]

const PRODUCT_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-500' },
  { value: 'DRAFT', label: 'Draft', color: 'bg-yellow-400' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-gray-400' },
]

// Each helper asks the backend for 1 row and reads only the "total" count
async function countUsers(role) {
  const res = await apiRequest(`/users?limit=1${role ? `&role=${role}` : ''}`)
  return res.data?.pagination?.total ?? 0
}

async function countProducts(status) {
  const res = await apiRequest(
    `/products/admin/all?limit=1${status ? `&status=${status}` : ''}`
  )
  return res.pagination?.total ?? 0
}

async function countOrders(status) {
  const res = await apiRequest(
    `/orders/admin/all?limit=1${status ? `&status=${status}` : ''}`
  )
  return res.data?.pagination?.total ?? 0
}

// Horizontal bar chart made with plain CSS (no library needed)
function BarChart({ title, items, counts }) {
  const max = Math.max(1, ...items.map((i) => counts[i.value] || 0))
  const total = items.reduce((sum, i) => sum + (counts[i.value] || 0), 0)

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-[#101A30]">{title}</h3>
        <span className="text-xs text-[#52647D]">{total} total</span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const count = counts[item.value] || 0
          const width = count === 0 ? 0 : Math.max(4, (count / max) * 100)
          return (
            <div key={item.value}>
              <div className="flex justify-between text-sm">
                <span className="text-[#52647D]">{item.label}</span>
                <span className="font-semibold text-[#101A30]">{count}</span>
              </div>
              <div className="h-2.5 bg-[#F0F0F8] rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [totals, setTotals] = useState(null)
  const [orderCounts, setOrderCounts] = useState({})
  const [userCounts, setUserCounts] = useState({})
  const [productCounts, setProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load all dashboard numbers once when the page opens
  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        setLoading(true)
        setError('')

        const [orderList, userList, productList] = await Promise.all([
          Promise.all(ORDER_STATUSES.map((s) => countOrders(s.value))),
          Promise.all(USER_ROLES.map((r) => countUsers(r.value))),
          Promise.all(PRODUCT_STATUSES.map((s) => countProducts(s.value))),
        ])

        if (cancelled) return

        const oc = {}
        ORDER_STATUSES.forEach((s, i) => (oc[s.value] = orderList[i]))
        const uc = {}
        USER_ROLES.forEach((r, i) => (uc[r.value] = userList[i]))
        const pc = {}
        PRODUCT_STATUSES.forEach((s, i) => (pc[s.value] = productList[i]))

        setOrderCounts(oc)
        setUserCounts(uc)
        setProductCounts(pc)
        setTotals({
          customers: uc.CUSTOMER,
          sellers: uc.SELLER,
          products: Object.values(pc).reduce((a, b) => a + b, 0),
          orders: Object.values(oc).reduce((a, b) => a + b, 0),
        })
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load dashboard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = [
    { title: 'Total Customers', value: totals?.customers },
    { title: 'Total Sellers', value: totals?.sellers },
    { title: 'Total Products', value: totals?.products },
    { title: 'Total Orders', value: totals?.orders },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Overview</h2>
      <p className="text-sm text-[#52647D] mt-1">
        A quick look at your store.
      </p>

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Number cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-[#52647D]">{card.title}</p>
            <p className="text-2xl font-bold text-[#101A30] mt-2">
              {loading ? '...' : card.value ?? '--'}
            </p>
          </div>
        ))}

        {/* Sales needs the Reports backend, so it stays "Coming soon" */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-[#52647D]">Total Sales</p>
          <p className="text-2xl font-bold text-[#101A30] mt-2">--</p>
          <p className="text-xs text-[#52647D] mt-1">Coming soon</p>
        </div>
      </div>

      {/* Charts */}
      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
          <BarChart title="Orders by status" items={ORDER_STATUSES} counts={orderCounts} />
          <div className="grid gap-5">
            <BarChart title="Users by role" items={USER_ROLES} counts={userCounts} />
            <BarChart
              title="Products by status"
              items={PRODUCT_STATUSES}
              counts={productCounts}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard