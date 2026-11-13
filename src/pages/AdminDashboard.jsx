// File: src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { Users, Store, Package, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts'
import { apiRequest } from '../services/api'

const ORDER_STATUSES = [
  { value: 'PENDING_PAYMENT', label: 'Pending', color: '#3B82F6' },
  { value: 'CONFIRMED', label: 'Confirmed', color: '#6366F1' },
  { value: 'PROCESSING', label: 'Processing', color: '#34D399' },
  { value: 'SHIPPED', label: 'Shipped', color: '#A855F7' },
  { value: 'DELIVERED', label: 'Delivered', color: '#14B8A6' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#FB923C' },
  { value: 'REFUNDED', label: 'Refunded', color: '#9CA3AF' },
]

const USER_ROLES = [
  { value: 'CUSTOMER', label: 'Customers', color: '#2864F0' },
  { value: 'SELLER', label: 'Sellers', color: '#10B981' },
  { value: 'ADMIN', label: 'Admins', color: '#A855F7' },
]

const PRODUCT_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: '#2864F0' },
  { value: 'DRAFT', label: 'Draft', color: '#FACC15' },
  { value: 'REJECTED', label: 'Rejected', color: '#EF4444' },
  { value: 'ARCHIVED', label: 'Archived', color: '#9CA3AF' },
]

const RANGES = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: 'all', label: 'All' },
]

async function countUsers(role) {
  const res = await apiRequest(`/users?limit=1&role=${role}`)
  return res.data?.pagination?.total ?? 0
}

async function countProducts(status) {
  const res = await apiRequest(`/admin/products?limit=1&status=${status}`)
  return res.data?.pagination?.total ?? 0
}

function formatMoney(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '--'
  return `₹${n.toLocaleString('en-IN')}`
}

function dayKey(value) {
  const d = new Date(value)
  return d.toISOString().slice(0, 10)
}

function dayLabel(key) {
  return new Date(key).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// Group orders by day (cancelled / refunded orders are not counted)
function buildDailySeries(dailyOrders) {
  const map = new Map()
  for (const o of dailyOrders || []) {
    if (o.status === 'CANCELLED' || o.status === 'REFUNDED') continue
    const key = dayKey(o.createdAt)
    const prev = map.get(key) || { orders: 0, value: 0 }
    map.set(key, { orders: prev.orders + 1, value: prev.value + Number(o.totalAmount || 0) })
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ name: dayLabel(key), orders: v.orders, value: v.value }))
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, note }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={26} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[#52647D]">{title}</p>
        <p className="text-3xl font-bold text-[#101A30] mt-1 truncate">{value}</p>
        {note && <p className="text-xs text-[#52647D] mt-1">{note}</p>}
      </div>
    </div>
  )
}

function CardShell({ title, icon: Icon, right, children }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className="text-[#2864F0]" />}
          <h3 className="font-semibold text-[#101A30]">{title}</h3>
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [userCounts, setUserCounts] = useState({})
  const [productCounts, setProductCounts] = useState({})
  const [statusSummary, setStatusSummary] = useState([])
  const [dailyOrders, setDailyOrders] = useState([])
  const [range, setRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(true)
  const [error, setError] = useState('')

  // Cards + role/product charts: load once
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError('')
        const [dash, userList, productList] = await Promise.all([
          apiRequest('/admin/dashboard'),
          Promise.all(USER_ROLES.map((r) => countUsers(r.value))),
          Promise.all(PRODUCT_STATUSES.map((s) => countProducts(s.value))),
        ])
        if (cancelled) return
        const uc = {}
        USER_ROLES.forEach((r, i) => (uc[r.value] = userList[i]))
        const pc = {}
        PRODUCT_STATUSES.forEach((s, i) => (pc[s.value] = productList[i]))
        setMetrics(dash.data?.metrics || null)
        setUserCounts(uc)
        setProductCounts(pc)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load dashboard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Sales chart + orders by status: reload when range changes
  useEffect(() => {
    let cancelled = false
    async function loadSales() {
      try {
        setSalesLoading(true)
        const params = new URLSearchParams()
        if (range !== 'all') {
          const start = new Date()
          start.setDate(start.getDate() - Number(range))
          params.set('startDate', start.toISOString())
        }
        const q = params.toString()
        const res = await apiRequest(`/admin/reports/sales${q ? `?${q}` : ''}`)
        if (cancelled) return
        setStatusSummary(res.data?.statusSummary || [])
        setDailyOrders(res.data?.dailyOrders || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load sales data')
      } finally {
        if (!cancelled) setSalesLoading(false)
      }
    }
    loadSales()
    return () => { cancelled = true }
  }, [range])

  const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0)
  const totalUsers = sum(userCounts)
  const totalProducts = sum(productCounts)
  const show = (n) => (loading ? '...' : n ?? '--')

  const donutData = USER_ROLES.map((r) => ({
    name: r.label, value: userCounts[r.value] || 0, color: r.color,
  }))

  const statusMap = {}
  statusSummary.forEach((s) => (statusMap[s.status] = s.count))
  const barData = ORDER_STATUSES.map((s) => ({
    name: s.label, value: statusMap[s.value] || 0, color: s.color,
  }))

  const series = buildDailySeries(dailyOrders)
  const maxProducts = Math.max(1, ...PRODUCT_STATUSES.map((s) => productCounts[s.value] || 0))

  const rangeButtons = (
    <div className="flex gap-1 bg-[#F0F0F8] rounded-full p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => setRange(r.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
            range === r.value ? 'bg-[#2864F0] text-white' : 'text-[#52647D]'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Admin Dashboard</h2>
      <p className="text-sm text-[#52647D] mt-1">Welcome back, Admin!</p>

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
        <StatCard title="Total Customers" value={show(metrics?.totalCustomers)} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard title="Total Sellers" value={show(userCounts.SELLER)} icon={Store} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard title="Total Products" value={show(totalProducts)} icon={Package} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard title="Total Orders" value={show(metrics?.totalOrders)} icon={ShoppingCart} iconBg="bg-orange-50" iconColor="text-orange-500" />
        <StatCard
          title="Order Value"
          value={loading ? '...' : formatMoney(metrics?.orderValue)}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          note="Excl. cancelled / refunded"
        />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
          <CardShell title="Sales Overview" icon={BarChart3} right={rangeButtons}>
            <div className="h-64">
              {salesLoading ? (
                <p className="text-[#52647D] text-sm">Loading...</p>
              ) : series.length === 0 ? (
                <div className="h-full flex items-center justify-center rounded-lg bg-[#F0F0F8] text-sm text-[#52647D]">
                  No orders in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2864F0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2864F0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#52647D' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#52647D' }} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Area type="monotone" dataKey="value" name="Order value" stroke="#2864F0" strokeWidth={2} fill="url(#salesFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardShell>

          <CardShell title="Users by Role" icon={Users}>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <div className="relative w-56 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={68} outerRadius={100} paddingAngle={2} stroke="none">
                      {donutData.map((d) => (<Cell key={d.name} fill={d.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-[#101A30]">{totalUsers}</span>
                  <span className="text-xs text-[#52647D]">Total Users</span>
                </div>
              </div>
              <ul className="space-y-3">
                {donutData.map((d) => (
                  <li key={d.name} className="flex items-center gap-3 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[#52647D] w-20">{d.name}</span>
                    <span className="font-semibold text-[#101A30]">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardShell>

          <CardShell title="Orders by Status" icon={ShoppingCart}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#52647D' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#52647D' }} />
                  <Tooltip cursor={{ fill: '#F0F0F8' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#101A30' }}>
                    {barData.map((d) => (<Cell key={d.name} fill={d.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardShell>

          <CardShell title="Products by Status" icon={Package}>
            <div className="space-y-4">
              {PRODUCT_STATUSES.map((s) => {
                const count = productCounts[s.value] || 0
                const width = count === 0 ? 0 : Math.max(4, (count / maxProducts) * 100)
                return (
                  <div key={s.value} className="flex items-center gap-4 text-sm">
                    <span className="w-20 text-[#52647D]">{s.label}</span>
                    <div className="flex-1 h-2.5 bg-[#F0F0F8] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: s.color }} />
                    </div>
                    <span className="w-6 text-right font-semibold text-[#101A30]">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardShell>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard