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

// Buttons shown for each current status.
// These follow the backend rules: REJECTED is final, so it has no actions.
const actionsByStatus = {
  PENDING: [
    { status: 'APPROVED', label: 'Approve', style: 'bg-[#2864F0] text-white hover:bg-[#2878C8]' },
    { status: 'REJECTED', label: 'Reject', style: 'border border-red-300 text-red-600 hover:bg-red-50' },
  ],
  APPROVED: [
    { status: 'SUSPENDED', label: 'Suspend', style: 'border border-red-300 text-red-600 hover:bg-red-50' },
  ],
  REJECTED: [],
  SUSPENDED: [
    { status: 'APPROVED', label: 'Approve', style: 'bg-[#2864F0] text-white hover:bg-[#2878C8]' },
  ],
}

const ID_LABELS = {
  PAN: 'PAN Card',
  AADHAAR: 'Aadhaar',
  VOTER_ID: 'Voter ID',
  DRIVING_LICENCE: 'Driving Licence',
  PASSPORT: 'Passport',
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Shows only the last 4 characters, e.g. XXXXXX234F
function maskId(value) {
  if (!value) return '-'
  return 'X'.repeat(Math.max(value.length - 4, 0)) + value.slice(-4)
}

// Aadhaar: the backend stores only the last 4 digits, so there is no full number to reveal.
function formatIdNumber(type, number, reveal) {
  if (!number) return '-'
  if (type === 'AADHAAR') return `XXXX XXXX ${number}`
  return reveal ? number : maskId(number)
}

function Section({ title, children }) {
  return (
    <div className="mt-6 first:mt-0">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#52647D] mb-2">{title}</h4>
      <div className="rounded-lg border border-gray-100 divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
      <span className="text-[#52647D]">{label}</span>
      <span className="col-span-2 text-[#101A30] break-words">{children || '-'}</span>
    </div>
  )
}

function AdminSellers() {
  const [activeTab, setActiveTab] = useState('PENDING')
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [processingId, setProcessingId] = useState('')

  // Seller details popup
  const [detailId, setDetailId] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [showId, setShowId] = useState(false)

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

  // Load full details (GST, ID proof, address, history) when the popup opens
  useEffect(() => {
    if (!detailId) return undefined
    let cancelled = false

    async function loadDetail() {
      try {
        setDetailLoading(true)
        setDetailError('')
        setDetail(null)
        const res = await apiRequest(`/sellers/${detailId}`)
        if (!cancelled) setDetail(res.data)
      } catch (err) {
        if (!cancelled) setDetailError(err.message || 'Could not load seller details.')
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [detailId])

  // Close the popup with the Escape key
  useEffect(() => {
    if (!detailId) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeDetails()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detailId])

  const openDetails = (seller) => {
    setError('')
    setMessage('')
    setShowId(false)
    setDetailId(seller.id)
  }

  const closeDetails = () => {
    setDetailId('')
    setDetail(null)
    setDetailError('')
    setShowId(false)
  }

  // Change seller status, then remove/update the row in the list.
  // Returns true when the change worked.
  const handleStatusChange = async (seller, newStatus) => {
    let reason = ''

    if (newStatus === 'REJECTED') {
      // The backend requires a reason when rejecting
      const input = window.prompt(`Reason for rejecting "${seller.shopName}":`)
      if (input === null) return false
      reason = input.trim()
      if (!reason) {
        setError('A reason is required to reject a seller.')
        return false
      }
    } else {
      const ok = window.confirm(`Change "${seller.shopName}" to ${newStatus}?`)
      if (!ok) return false
    }

    try {
      setProcessingId(seller.id)
      setError('')
      setMessage('')

      await apiRequest(`/sellers/${seller.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, ...(reason ? { reason } : {}) }),
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
      return true
    } catch (err) {
      setError(err.message || 'Could not update seller status.')
      return false
    } finally {
      setProcessingId('')
    }
  }

  const handleDetailAction = async (status) => {
    if (!detail) return
    const ok = await handleStatusChange(detail, status)
    if (ok) closeDetails()
  }

  const detailActions = detail ? actionsByStatus[detail.status] || [] : []

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

      {error && !detailId && (
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openDetails(seller)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-[#101A30] hover:bg-[#F0F0F8] transition"
                        >
                          View details
                        </button>
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

      {/* Seller details popup */}
      {detailId && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
          onClick={closeDetails}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#101A30]">
                  {detail?.shopName || 'Seller details'}
                </h3>
                {detail && (
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full border text-xs font-semibold ${
                      badgeColors[detail.status] || ''
                    }`}
                  >
                    {detail.status}
                  </span>
                )}
              </div>
              <button
                onClick={closeDetails}
                aria-label="Close"
                className="text-2xl leading-none text-[#52647D] hover:text-[#101A30]"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              {error && (
                <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {detailLoading ? (
                <p className="text-[#52647D]">Loading details...</p>
              ) : detailError ? (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                  {detailError}
                </div>
              ) : detail ? (
                <>
                  <Section title="Shop">
                    <Row label="Shop name">{detail.shopName}</Row>
                    <Row label="Description">{detail.description}</Row>
                    <Row label="Applied on">{formatDateTime(detail.createdAt)}</Row>
                  </Section>

                  <Section title="Owner">
                    <Row label="Name">{detail.user?.name}</Row>
                    <Row label="Email">{detail.user?.email}</Row>
                    <Row label="Account created">{formatDate(detail.user?.createdAt)}</Row>
                  </Section>

                  <Section title="Business details">
                    <Row label="GST number">{detail.gstNumber || 'Not provided'}</Row>
                  </Section>

                  <Section title="Identity proof">
                    <Row label="ID type">{ID_LABELS[detail.idProofType] || detail.idProofType}</Row>
                    <Row label="ID number">
                      <span className="font-mono">
                        {formatIdNumber(detail.idProofType, detail.idProofNumber, showId)}
                      </span>
                      {detail.idProofType !== 'AADHAAR' && detail.idProofNumber && (
                        <button
                          onClick={() => setShowId((prev) => !prev)}
                          className="ml-3 text-xs font-semibold text-[#2864F0] hover:text-[#2878C8]"
                        >
                          {showId ? 'Hide' : 'Show full number'}
                        </button>
                      )}
                    </Row>
                    {detail.idProofType === 'AADHAAR' && (
                      <Row label="Note">Only the last 4 digits of Aadhaar are stored.</Row>
                    )}
                  </Section>

                  <Section title="Address">
                    <Row label="Address line 1">{detail.addressLine1}</Row>
                    <Row label="Address line 2">{detail.addressLine2}</Row>
                    <Row label="City">{detail.city}</Row>
                    <Row label="State">{detail.state}</Row>
                    <Row label="PIN code">{detail.postalCode}</Row>
                    <Row label="Country">{detail.country}</Row>
                  </Section>

                  <Section title="Status history">
                    {detail.statusHistory?.length ? (
                      detail.statusHistory.map((item) => (
                        <div key={item.id} className="px-4 py-2.5 text-sm">
                          <p className="text-[#101A30]">
                            {item.fromStatus} → {item.toStatus}
                            <span className="text-[#52647D]">
                              {' '}
                              by {item.admin?.name || item.admin?.email || 'admin'}
                            </span>
                          </p>
                          {item.reason && (
                            <p className="text-[#52647D] mt-0.5">Reason: {item.reason}</p>
                          )}
                          <p className="text-xs text-[#52647D] mt-0.5">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-[#52647D]">No status changes yet.</p>
                    )}
                  </Section>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-gray-100">
              {detailActions.map((action) => (
                <button
                  key={action.status}
                  disabled={processingId === detailId}
                  onClick={() => handleDetailAction(action.status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${action.style}`}
                >
                  {processingId === detailId ? 'Please wait...' : action.label}
                </button>
              ))}
              <button
                onClick={closeDetails}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-[#101A30] hover:bg-[#F0F0F8] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSellers