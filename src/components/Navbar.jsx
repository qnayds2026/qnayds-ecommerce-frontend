import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { apiRequest } from '../services/api'
import { CircleUser, Package, MapPin, Bell, LogOut } from 'lucide-react'

// Category id is the same as the slug returned by GET /categories
const navCategories = [
  { id: 'fashion', name: 'Fashion' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'footwear', name: 'Footwear' },
  { id: 'home-kitchen', name: 'Home & Kitchen' },
  { id: 'accessories', name: 'Accessories' },
]

function getStoredUser() {
  try {
    const raw = sessionStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(getStoredUser())
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the account menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close the account menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Re-check the logged-in user and cart count on every route change
  useEffect(() => {
    const currentUser = getStoredUser()
    setUser(currentUser)

    const token = sessionStorage.getItem('accessToken')
    if (token && currentUser?.role === 'CUSTOMER') {
      apiRequest('/cart')
        .then((res) => setCartCount(res?.data?.itemCount ?? 0))
        .catch(() => setCartCount(0))
    } else {
      setCartCount(0)
    }
  }, [location.pathname])

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.firstName ||
    (user?.email ? user.email.split('@')[0] : 'Account')

  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'SELLER'
      ? '/seller'
      : '/customer'

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    setUser(null)
    setCartCount(0)
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm">

      {/* Main Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">

          <div className="flex items-center justify-between gap-5">

            {/* Logo */}
            <Link
              to="/"
              className="text-2xl font-bold text-[#2864F0] shrink-0"
            >
              QNAYDS
            </Link>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                className="w-full px-5 py-3 bg-[#F0F0F8] rounded-l-lg outline-none text-sm"
              />

              <button className="bg-[#2864F0] text-white px-6 rounded-r-lg hover:bg-[#2878C8]">
                Search
              </button>
            </div>

            {/* Customer Actions */}
            <div className="flex items-center gap-5 text-[#101A30]">

              <Link
                to="/wishlist"
                className="hidden sm:block hover:text-[#2864F0] text-sm font-medium"
              >
                ♡ Wishlist
              </Link>

              <Link
                to="/cart"
                className="relative hover:text-[#2864F0] text-sm font-medium"
              >
                🛒 Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-[#2864F0] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex items-center gap-2 text-sm font-medium hover:text-[#2864F0]"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#2864F0] text-white flex items-center justify-center text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:block max-w-[110px] truncate">
                      {displayName}
                    </span>
                    <span className="text-xs">▾</span>
                  </button>

                  {menuOpen && (
  <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50">
    {/* Heading */}
    <p className="px-6 pb-2 text-sm font-semibold text-[#101A30]">
      Your Account
    </p>

    {/* My Profile (goes to the dashboard of the logged-in role) */}
    <Link
      to={dashboardPath}
      className="flex items-center gap-4 px-6 py-3 text-sm text-[#101A30] hover:bg-[#F0F0F8]"
    >
      <CircleUser size={20} strokeWidth={1.5} />
      My Profile
    </Link>

    {user?.role === 'CUSTOMER' && (
      <>
        <Link
          to="/orders"
          className="flex items-center gap-4 px-6 py-3 text-sm text-[#101A30] hover:bg-[#F0F0F8]"
        >
          <Package size={20} strokeWidth={1.5} />
          Orders
        </Link>

        <Link
          to="/addresses"
          className="flex items-center gap-4 px-6 py-3 text-sm text-[#101A30] hover:bg-[#F0F0F8]"
        >
          <MapPin size={20} strokeWidth={1.5} />
          Saved Addresses
        </Link>

        <Link
          to="/notifications"
          className="flex items-center gap-4 px-6 py-3 text-sm text-[#101A30] hover:bg-[#F0F0F8]"
        >
          <Bell size={20} strokeWidth={1.5} />
          Notifications
        </Link>
      </>
    )}

    {/* Logout */}
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-4 px-6 py-3 text-sm text-[#101A30] hover:bg-[#F0F0F8]"
    >
      <LogOut size={20} strokeWidth={1.5} />
      Logout
    </button>
  </div>
)}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-[#2864F0] text-white px-4 py-2.5 rounded-lg hover:bg-[#2878C8] text-sm"
                >
                  Login
                </Link>
              )}

            </div>
          </div>

          {/* Mobile Search */}
          <div className="flex md:hidden mt-4">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-3 bg-[#F0F0F8] rounded-lg outline-none text-sm"
            />
          </div>

        </div>
      </div>

      {/* Category Navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-7 overflow-x-auto py-4 whitespace-nowrap">

          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-semibold pb-1 ${
                isActive
                  ? 'text-[#2864F0] border-b-2 border-[#2864F0]'
                  : 'text-[#101A30] hover:text-[#2864F0]'
              }`
            }
          >
            Home
          </NavLink>

          {navCategories.map((category) => (
            <Link
              key={category.id}
              to={`/products?categoryId=${category.id}`}
              className="text-sm font-medium text-[#101A30] hover:text-[#2864F0] transition"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

    </nav>
  )
}

export default Navbar