/**
 * Seller Dashboard Home
 *
 * API shapes used:
 *   GET /sellers/me         → { success, data: { id, shopName, description, status, … } }
 *   GET /seller/orders      → { success, data: { orders: [], pagination: {} } }
 *   GET /products/mine      → { success, data: Product[] }
 *   GET /seller/returns     → { success, data: { items: [], total, page, limit } }
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  sellerProfileService,
  sellerOrderService,
  sellerProductService,
  sellerReturnService,
} from '../../services/seller'
import {
  ShoppingBag, Package, RotateCcw, Boxes, Store,
  TrendingUp, Clock, CheckCircle, AlertCircle, ChevronRight,
} from 'lucide-react'

/* ── helpers ── */
function fmt(amount) {
  if (amount == null) return '—'
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

const STATUS_BADGE = {
  PENDING:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED:  'bg-green-100  text-green-700  border-green-200',
  REJECTED:  'bg-red-100    text-red-700    border-red-200',
  SUSPENDED: 'bg-gray-100   text-gray-700   border-gray-200',
}

const ORDER_STATUS_COLOR = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100   text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED:    'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100  text-green-700',
  CANCELLED:  'bg-red-100    text-red-700',
  REFUNDED:   'bg-gray-100   text-gray-600',
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, sub, iconBg, to }) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#52647D]">{label}</p>
        <p className="text-2xl font-bold text-[#101A30] mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-[#52647D] mt-1">{sub}</p>}
      </div>
      {to && <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

/* ── main component ── */
function SellerDashboardHome() {
  const [profile,  setProfile]  = useState(null)
  const [orders,   setOrders]   = useState([])
  const [products, setProducts] = useState([])
  const [returns,  setReturns]  = useState([])   // items[]
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      sellerService.getMyProfile(),
      sellerService.listOrders({ page: 1, limit: 5 }),
      sellerService.listMyProducts(),
      sellerService.listReturns({ page: 1, limit: 10 }),
    ])
      .then(([profileRes, ordersRes, productsRes, returnsRes]) => {
        setProfile(profileRes?.data || null)
        setOrders(ordersRes?.data?.orders || [])
        setProducts(productsRes?.data || [])
        setReturns(returnsRes?.data?.items || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#52647D]">Loading dashboard…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm">{error}</div>
  )

  /* derived stats */
  const totalRevenue   = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
  const pendingOrders  = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING'].includes(o.status)).length
  const activeProducts = products.filter(p => p.status === 'ACTIVE').length
  const draftProducts  = products.filter(p => p.status === 'DRAFT').length
  const pendingReturns = returns.filter(r => r.status === 'REQUESTED').length

  return (
    <div className="space-y-6">



      {/* ── Status banners (only for non-approved states) ── */}
      {profile?.status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <Clock size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Approval Pending</p>
            <p className="text-xs text-yellow-700 mt-0.5">Your seller account is under review. You can set up products while you wait.</p>
          </div>
        </div>
      )}
      {profile?.status === 'SUSPENDED' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Account Suspended</p>
            <p className="text-xs text-red-700 mt-0.5">Your shop has been suspended. Please contact support.</p>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Recent Revenue"   value={fmt(totalRevenue)} sub="From listed orders"           iconBg="bg-[#2864F0]" />
        <StatCard icon={ShoppingBag} label="Pending Orders"  value={pendingOrders}     sub="Needs attention"              iconBg="bg-orange-500" to="/seller/orders" />
        <StatCard icon={Package}     label="Active Products" value={activeProducts}     sub={`${draftProducts} draft(s)`} iconBg="bg-green-500"  to="/seller/products" />
        <StatCard icon={RotateCcw}   label="Return Requests" value={pendingReturns}     sub="Awaiting decision"           iconBg="bg-purple-500" to="/seller/returns" />
      </div>

      {/* ── Shop Profile card ── */}
      {profile && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2864F0]/10 flex items-center justify-center">
                <Store size={20} className="text-[#2864F0]" />
              </div>
              <div>
                <p className="font-bold text-[#101A30]">{profile.shopName}</p>
                <p className="text-xs text-[#52647D]">
                  Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}
                </p>
              </div>
            </div>
            <Link to="/seller/profile" className="text-xs text-[#2864F0] font-semibold hover:underline">
              View Profile →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-[#F0F0F8] rounded-xl p-3">
              <p className="text-lg font-bold text-[#101A30]">{products.length}</p>
              <p className="text-xs text-[#52647D]">Total Products</p>
            </div>
            <div className="bg-[#F0F0F8] rounded-xl p-3">
              <p className="text-lg font-bold text-[#101A30]">{activeProducts}</p>
              <p className="text-xs text-[#52647D]">Live Products</p>
            </div>
            <div className="bg-[#F0F0F8] rounded-xl p-3">
              <p className="text-lg font-bold text-[#101A30]">{orders.length}</p>
              <p className="text-xs text-[#52647D]">Recent Orders</p>
            </div>
            <div className="bg-[#F0F0F8] rounded-xl p-3">
              <p className="text-lg font-bold text-[#101A30]">{returns.length}</p>
              <p className="text-xs text-[#52647D]">Total Returns</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Orders ── */}
      <div className="grid grid-cols-1 gap-6">

        {/* Recent orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#101A30]">Recent Orders</h3>
            <Link to="/seller/orders" className="text-xs text-[#2864F0] hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-[#52647D]">No orders yet.</p>
              </div>
            ) : (
              orders.map(o => (
                <Link
                  key={o.id}
                  to={`/seller/orders/${o.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F0F0F8] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#101A30] font-mono">#{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-[#52647D] mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      {o.items?.length ? ` · ${o.items.length} item(s)` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#101A30]">{fmt(o.totalAmount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>



      </div>

      {/* ── Products table ── */}
    </div>
  )
}

export default SellerDashboardHome
