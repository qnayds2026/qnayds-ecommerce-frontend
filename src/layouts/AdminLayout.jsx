// File: src/layouts/AdminLayout.jsx
import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  ShoppingBag,
  Tags,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  Truck,
  Menu,
  X,
  RotateCcw,

} from 'lucide-react'

// Sidebar menu items (pages are added step by step)
const menuItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sellers', label: 'Sellers', icon: Store },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/shipments', label: 'Shipping', icon: Truck },
  { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'))
  } catch {
    return null
  }
}

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getStoredUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close the mobile sidebar whenever the page changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close the mobile sidebar with the Esc key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#F0F0F8]">
      {/* Dark overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: slides in on mobile, always visible on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#101A30] text-white flex flex-col shrink-0 overflow-y-auto transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between">
          <Link to="/admin" className="px-6 py-5 text-2xl font-bold text-white">
            QCART
            <span className="block text-xs font-normal text-[#B8C4D9] mt-1">
              Admin Panel
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden m-4 p-1 rounded-lg text-[#B8C4D9] hover:bg-white/10 hover:text-white transition"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#2864F0] text-white'
                      : 'text-[#B8C4D9] hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.7} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 mx-3 mb-4 px-4 py-3 rounded-lg text-sm font-medium text-[#B8C4D9] hover:bg-white/10 hover:text-white transition"
        >
          <LogOut size={18} strokeWidth={1.7} />
          Logout
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#101A30] hover:bg-[#E4E4F2] transition"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold text-[#101A30]">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-[#52647D]">
              {user?.name || user?.email || 'Admin'}
            </span>
            <span className="w-9 h-9 rounded-full bg-[#2864F0] text-white flex items-center justify-center text-sm font-bold">
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout