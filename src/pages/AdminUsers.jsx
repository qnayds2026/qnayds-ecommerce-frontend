// File: src/pages/AdminUsers.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

// Role filter tabs. Customers tab uses the admin customers API (block / unblock).
const tabs = [
  { value: '', label: 'All' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'SELLER', label: 'Sellers' },
  { value: 'ADMIN', label: 'Admins' },
]

const badgeColors = {
  CUSTOMER: 'bg-blue-50 text-blue-700 border-blue-200',
  SELLER: 'bg-green-50 text-green-700 border-green-200',
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
}

const statusColors = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  BLOCKED: 'bg-red-50 text-red-700 border-red-200',
}

const PAGE_SIZE = 10

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AdminUsers() {
  const [activeTab, setActiveTab] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [processingId, setProcessingId] = useState('')

  const isCustomerTab = activeTab === 'CUSTOMER'

  // Load users whenever role tab, search text or page changes
  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(PAGE_SIZE))
        if (search) params.set('search', search)

        if (isCustomerTab) {
          // Admin customers API: data.customers + data.pagination
          const res = await apiRequest(`/admin/customers?${params.toString()}`)
          if (!cancelled) {
            setUsers(res.data?.customers || [])
            setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
          }
        } else {
          if (activeTab) params.set('role', activeTab)
          const res = await apiRequest(`/users?${params.toString()}`)
          if (!cancelled) {
            setUsers(res.data?.users || [])
            setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUsers()
    return () => {
      cancelled = true
    }
  }, [activeTab, search, page, isCustomerTab])

  const handleTabChange = (value) => {
    setMessage('')
    setActiveTab(value)
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  // Block (reason required) or unblock a customer
  const handleStatusChange = async (user, newStatus) => {
    let reason
    if (newStatus === 'BLOCKED') {
      reason = window.prompt(`Reason for blocking ${user.email}:`)
      if (reason === null) return
      reason = reason.trim()
      if (!reason) {
        setError('A reason is required to block a customer.')
        return
      }
    } else {
      const ok = window.confirm(`Unblock ${user.email}?`)
      if (!ok) return
    }

    try {
      setProcessingId(user.id)
      setError('')
      setMessage('')

      const body = { status: newStatus }
      if (reason) body.reason = reason

      await apiRequest(`/admin/customers/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      setMessage(`${user.email} is now ${newStatus}.`)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      )
    } catch (err) {
      setError(err.message || 'Could not update customer status.')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Users</h2>
      <p className="text-sm text-[#52647D] mt-1">
        View all registered users. ({pagination.total} total)
      </p>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
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

      {isCustomerTab && (
        <p className="text-xs text-[#52647D] mt-3">
          You can block or unblock customers here. Blocked customers cannot use their account.
        </p>
      )}

      {/* Search box */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          className="w-full max-w-sm px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#101A30] focus:outline-none focus:border-[#2864F0]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#101A30] hover:bg-[#E4E4F2] transition"
          >
            Clear
          </button>
        )}
      </form>

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
          <p className="p-6 text-[#52647D]">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-[#52647D]">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                {isCustomerTab && <th className="px-6 py-4 font-medium">Status</th>}
                <th className="px-6 py-4 font-medium">Joined</th>
                {isCustomerTab && <th className="px-6 py-4 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isProcessing = processingId === user.id
                return (
                  <tr key={user.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4 font-semibold text-[#101A30]">
                      {user.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-[#52647D]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
                          badgeColors[user.role] || ''
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    {isCustomerTab && (
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
                            statusColors[user.status] || ''
                          }`}
                        >
                          {user.status || '-'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-[#52647D]">
                      {formatDate(user.createdAt)}
                    </td>
                    {isCustomerTab && (
                      <td className="px-6 py-4">
                        {user.status === 'BLOCKED' ? (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(user, 'ACTIVE')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2864F0] text-white hover:bg-[#2878C8] transition disabled:opacity-50"
                          >
                            {isProcessing ? 'Please wait...' : 'Unblock'}
                          </button>
                        ) : (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(user, 'BLOCKED')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          >
                            {isProcessing ? 'Please wait...' : 'Block'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#52647D]">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#101A30] hover:bg-[#E4E4F2] transition disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers