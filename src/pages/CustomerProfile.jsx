import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, MapPin, LogOut } from 'lucide-react'
import { apiRequest } from '../services/api'

function CustomerProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the logged-in user from the backend
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    apiRequest('/auth/me')
      .then((res) => {
        setProfile(res?.user ?? res?.data?.user ?? null)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load your profile')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-[#52647D]">
        Loading your profile...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-red-600">
        {error || 'Profile not found'}
      </div>
    )
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  const roleLabel =
    profile.role === 'CUSTOMER'
      ? 'Customer'
      : profile.role === 'SELLER'
      ? 'Seller'
      : profile.role === 'ADMIN'
      ? 'Admin'
      : profile.role

      // Split the full name into first and last name for display
  const nameParts = (profile.name || '').trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ')

  const sideLinkClass =
    'flex items-center gap-4 px-6 py-4 text-sm font-medium text-[#52647D] hover:bg-[#F0F0F8] hover:text-[#2864F0] border-b border-gray-100'

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-5">

        {/* Left sidebar */}
        <aside className="md:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <span className="w-12 h-12 rounded-full bg-[#2864F0] text-white flex items-center justify-center text-xl font-bold">
              {profile.name?.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-[#52647D]">Hello,</p>
              <p className="font-semibold text-[#101A30] truncate">
                {profile.name}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Link to="/orders" className={sideLinkClass}>
              <Package size={20} strokeWidth={1.5} />
              MY ORDERS
            </Link>
            <Link to="/addresses" className={sideLinkClass}>
              <MapPin size={20} strokeWidth={1.5} />
              SAVED ADDRESSES
            </Link>
            <button
              onClick={handleLogout}
              className={`${sideLinkClass} w-full text-left border-b-0`}
            >
              <LogOut size={20} strokeWidth={1.5} />
              LOGOUT
            </button>
          </div>
        </aside>
                {/* Right content */}
        <section className="flex-1 bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-semibold text-[#101A30] mb-4">
            Personal Information
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="bg-[#F0F0F8] border border-gray-200 rounded px-4 py-3 text-sm text-[#52647D] w-full sm:w-64">
              {firstName}
            </div>
            <div className="bg-[#F0F0F8] border border-gray-200 rounded px-4 py-3 text-sm text-[#52647D] w-full sm:w-64 min-h-[46px]">
              {lastName}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-[#101A30] mb-4">
            Email Address
          </h2>
          <div className="bg-[#F0F0F8] border border-gray-200 rounded px-4 py-3 text-sm text-[#52647D] w-full sm:w-64 break-all">
            {profile.email}
          </div>
        </section>

       
      </div>
    </div>
  )
}

export default CustomerProfile