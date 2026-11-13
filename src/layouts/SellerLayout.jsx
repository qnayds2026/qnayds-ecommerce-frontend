import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Store, Package, ShoppingBag,
  RotateCcw, Boxes, Truck, ChevronLeft, ChevronRight,
  LogOut, Menu, X,
} from 'lucide-react'
import sellerService from '../api/service/sellerService'

function getStoredUser() {
  try { return JSON.parse(sessionStorage.getItem('user')) }
  catch { return null }
}

const navItems = [
  { to: '/seller',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/seller/profile',    label: 'Shop',       icon: Store },
  { to: '/seller/products',   label: 'Products',   icon: Package },
  { to: '/seller/orders',     label: 'Orders',     icon: ShoppingBag },
  { to: '/seller/shipments',  label: 'Shipments',  icon: Truck },
  { to: '/seller/returns',    label: 'Returns',    icon: RotateCcw },
  { to: '/seller/inventory',  label: 'Inventory',  icon: Boxes },
]

/* ── Sidebar defined OUTSIDE SellerLayout to avoid remount on every render ── */
function SidebarContent({ collapsed, mobile, displayName, user, onCollapse, onClose, onLogout }) {
  return (
    <div className="flex flex-col h-full">

      {/* Brand row */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-blue-700/40">
        {(!collapsed || mobile) && (
          <div>
            <span className="text-white font-bold text-lg tracking-wide">QNAYDS</span>
            <p className="text-blue-200 text-xs mt-0.5">Seller Centre</p>
          </div>
        )}
        {!mobile && (
          <button onClick={onCollapse} className="text-blue-200 hover:text-white p-1 rounded"
            title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
        {mobile && (
          <button onClick={onClose} className="text-blue-200 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Avatar */}
      {(!collapsed || mobile) && (
        <div className="px-4 py-4 border-b border-blue-700/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{displayName}</p>
              <p className="text-blue-200 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed && !mobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#2864F0]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-blue-700/40">
        <button
          onClick={onLogout}
          title={collapsed && !mobile ? 'Logout' : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={18} className="shrink-0" />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

function SellerLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = getStoredUser()
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Seller')

  const handleLogout = async () => {
    try { await sellerService.logout() } catch { /**/ }
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  const sidebarProps = {
    collapsed,
    displayName,
    user,
    onCollapse: () => setCollapsed(c => !c),
    onClose:    () => setMobileOpen(false),
    onLogout:   handleLogout,
  }

  return (
    <div className="min-h-screen flex bg-[#F0F0F8]">

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-[#2864F0] transition-all duration-300 shrink-0 sticky top-0 self-start h-screen ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent mobile={false} {...sidebarProps} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#2864F0] z-50 md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent mobile={true} {...sidebarProps} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600 hover:text-[#2864F0] p-1">
            <Menu size={22} />
          </button>
          <span className="text-sm font-semibold text-[#101A30]">Seller Dashboard</span>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SellerLayout
