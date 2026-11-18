// File: src/pages/AdminSellers.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

// Filter tabs (value '' means all sellers)
const tabs = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: '', label: 'All' },
]

const badgeColors = {
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-gray-100 text-gray-700 border-gray-200',
}

// Buttons shown for each current status
const actionsByStatus = {
  PENDING: [
    { status: 'APPROVED', label: 'Approve', style: 'bg-[#2864F0] text-white hover:bg-[#2878C8]' },
    { status: 'REJECTED', label: 'Reject', style: 'border border-red-300 text-red-600 hover:bg-red-50' },
  ],
  APPROVED: [
    { status: 'SUSPENDED', label: 'Suspend', style: 'border border-red-300 text-red-600 hover:bg-red-50' },
  ],
  REJECTED: [
    { status: 'APPROVED', label: 'Approve', style: 'bg-[#2864F0] text-white hover:bg-[#2878C8]' },
  ],
  SUSPENDED: [
    { status: 'APPROVED', label: 'Approve', style: 'bg-[#2864F0] text-white hover:bg-[#2878C8]' },
  ],
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AdminSellers() {
  const [activeTab, setActiveTab] = useState('PENDING')
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [processingId, setProcessingId] = useState('')

  // Load sellers whenever the selected tab changes
  useEffect(() => {
    let cancelled = false

    async function loadSellers() {
      try {
        setLoading(true)
        setError('')
        const query = activeTab ? `?status=${activeTab}` : ''
        const res = await apiRequest(`/sellers${query}`)
        if (!cancelled) {
          // API returns data.sellers (array) and data.pagination
          // Array.isArray keeps this safe if the old array format comes back
          const list = Array.isArray(res.data) ? res.data : res.data?.sellers
          setSellers(list || [])
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSellers()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  // Change seller status, then remove/update the row in the list
  const handleStatusChange = async (seller, newStatus) => {
    const ok = window.confirm(
      `Change "${seller.shopName}" to ${newStatus}?`
    )
    if (!ok) return

    try {
      setProcessingId(seller.id)
      setError('')
      setMessage('')

      await apiRequest(`/sellers/${seller.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })

      setMessage(`${seller.shopName} is now ${newStatus}.`)

      // On a filtered tab the seller no longer belongs there
      if (activeTab) {
        setSellers((prev) => prev.filter((s) => s.id !== seller.id))
      } else {
        setSellers((prev) =>
          prev.map((s) => (s.id === seller.id ? { ...s, status: newStatus } : s))
        )
      }
    } catch (err) {
      setError(err.message || 'Could not update seller status.')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Seller Management</h2>
      <p className="text-sm text-[#52647D] mt-1">
        Review seller applications and manage seller accounts.
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setMessage('')
              setActiveTab(tab.value)
            }}
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

      {message && (
        <div className="mt-5 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-5 bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-6 text-[#52647D]">Loading sellers...</p>
        ) : sellers.length === 0 ? (
          <p className="p-6 text-[#52647D]">No sellers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Shop</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Applied</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => {
                const actions = actionsByStatus[seller.status] || []
                const isProcessing = processingId === seller.id

                return (
                  <tr key={seller.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#101A30]">{seller.shopName}</p>
                      {seller.description && (
                        <p className="text-xs text-[#52647D] mt-1 max-w-xs truncate">
                          {seller.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#101A30]">{seller.user?.name || '-'}</p>
                      <p className="text-xs text-[#52647D]">{seller.user?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
                          badgeColors[seller.status] || ''
                        }`}
                      >
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#52647D]">
                      {formatDate(seller.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {actions.map((action) => (
                          <button
                            key={action.status}
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(seller, action.status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${action.style}`}
                          >
                            {isProcessing ? 'Please wait...' : action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminSellers