// File: src/pages/AdminShipments.jsx
import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api'

const tabs = [
  { value: '', label: 'All' },
  { value: 'READY_TO_SHIP', label: 'Ready to ship' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'DELIVERY_FAILED', label: 'Delivery failed' },
  { value: 'RETURN_TO_ORIGIN', label: 'Return to origin' },
]

// Same rules as the backend (shipping-status.js)
const transitions = {
  READY_TO_SHIP: ['PACKED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['IN_TRANSIT', 'DELIVERY_FAILED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'RETURN_TO_ORIGIN'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'RETURN_TO_ORIGIN'],
  DELIVERY_FAILED: ['IN_TRANSIT', 'RETURN_TO_ORIGIN'],
  DELIVERED: [],
  RETURN_TO_ORIGIN: [],
}

const badgeColors = {
  READY_TO_SHIP: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  PACKED: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  IN_TRANSIT: 'bg-purple-50 text-purple-700 border-purple-200',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  DELIVERY_FAILED: 'bg-red-50 text-red-700 border-red-200',
  RETURN_TO_ORIGIN: 'bg-gray-100 text-gray-700 border-gray-200',
}

const PAGE_SIZE = 10

const label = (s) => (s || '').replace(/_/g, ' ')

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AdminShipments() {
  const [activeTab, setActiveTab] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [shipments, setShipments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [processingId, setProcessingId] = useState('')
  const [expandedId, setExpandedId] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(PAGE_SIZE))
        if (activeTab) params.set('status', activeTab)
        if (search) params.set('search', search)

        const res = await apiRequest(`/admin/shipments?${params.toString()}`)
        if (!cancelled) {
          setShipments(res.data?.shipments || [])
          setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeTab, search, page, reloadKey])

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

  const handleStatusChange = async (shipment, newStatus) => {
    if (!newStatus) return
    const note = window.prompt(
      `Change to ${label(newStatus)}. Optional note (leave empty to skip):`
    )
    if (note === null) return

    try {
      setProcessingId(shipment.id)
      setError('')
      setMessage('')

      const body = { status: newStatus }
      if (note.trim()) body.description = note.trim()

      await apiRequest(`/admin/shipments/${shipment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      setMessage(`Shipment ${shipment.trackingNumber} is now ${label(newStatus)}.`)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err.message || 'Could not update shipment status.')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Shipping</h2>
      <p className="text-sm text-[#52647D] mt-1">
        Track and update shipments. ({pagination.total} total)
      </p>

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

      <form onSubmit={handleSearchSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by tracking number, carrier or order number"
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
          <p className="p-6 text-[#52647D]">Loading shipments...</p>
        ) : shipments.length === 0 ? (
          <p className="p-6 text-[#52647D]">No shipments found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order #</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Carrier</th>
                <th className="px-6 py-4 font-medium">Tracking</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Shipped</th>
                <th className="px-6 py-4 font-medium">Expected</th>
                <th className="px-6 py-4 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => {
                const next = transitions[s.status] || []
                const isProcessing = processingId === s.id
                const isOpen = expandedId === s.id
                const items = s.sellerOrder?.items || []
                return (
                  <Fragment key={s.id}>
                    <tr className="border-b border-gray-50">
                      <td className="px-6 py-4 font-semibold text-[#101A30]">
                        {s.sellerOrder?.order?.orderNumber ? (
                          <Link
                            to="/admin/orders"
                            className="text-[#2864F0] hover:underline"
                          >
                            {s.sellerOrder.order.orderNumber}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#101A30]">
                        {items.length === 0 ? (
                          '-'
                        ) : (
                          <ul className="space-y-1">
                            {items.map((it) => (
                              <li key={it.id} className="text-xs">
                                {it.productName} × {it.quantity}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#101A30]">{s.carrierName}</td>
                      <td className="px-6 py-4">
                        <p className="text-[#101A30]">{s.trackingNumber}</p>
                        {s.trackingUrl && (
                          <a
                            href={s.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#2864F0] hover:underline"
                          >
                            Track link
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
                            badgeColors[s.status] || ''
                          }`}
                        >
                          {label(s.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#52647D]">{formatDate(s.shippedAt)}</td>
                      <td className="px-6 py-4 text-[#52647D]">
                        {formatDate(s.estimatedDeliveryAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {next.length > 0 ? (
                            <select
                              disabled={isProcessing}
                              value=""
                              onChange={(e) => handleStatusChange(s, e.target.value)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-[#101A30] disabled:opacity-50"
                            >
                              <option value="">
                                {isProcessing ? 'Please wait...' : 'Change status'}
                              </option>
                              {next.map((n) => (
                                <option key={n} value={n}>
                                  {label(n)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-[#52647D]">Final</span>
                          )}
                          <button
                            onClick={() => setExpandedId(isOpen ? '' : s.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-[#101A30] hover:bg-[#E4E4F2] transition"
                          >
                            {isOpen ? 'Hide' : 'History'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-gray-50 bg-[#F8F8FC]">
                        <td colSpan={8} className="px-6 py-4">
                          {(s.events || []).length === 0 ? (
                            <p className="text-xs text-[#52647D]">No tracking events yet.</p>
                          ) : (
                            <ul className="space-y-2">
                              {s.events.map((ev) => (
                                <li key={ev.id} className="text-xs text-[#52647D]">
                                  <span className="font-semibold text-[#101A30]">
                                    {label(ev.status)}
                                  </span>{' '}
                                  · {formatDate(ev.createdAt)} · {ev.source}
                                  {ev.description ? ` · ${ev.description}` : ''}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

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

export default AdminShipments