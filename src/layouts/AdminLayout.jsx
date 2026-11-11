// File: src/layouts/AdminLayout.jsx
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'

// Sidebar menu items (pages are added step by step)
const menuItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sellers', label: 'Sellers', icon: Store },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
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
  const user = getStoredUser()

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#F0F0F8]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#101A30] text-white flex flex-col shrink-0">
        <Link to="/admin" className="px-6 py-5 text-2xl font-bold text-white">
          QNAYDS
          <span className="block text-xs font-normal text-[#B8C4D9] mt-1">
            Admin Panel
          </span>
        </Link>

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
        <header className="bg-white px-8 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-semibold text-[#101A30]">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#52647D]">
              {user?.name || user?.email || 'Admin'}
            </span>
            <span className="w-9 h-9 rounded-full bg-[#2864F0] text-white flex items-center justify-center text-sm font-bold">
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout