// File: src/pages/AdminInventory.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

const PAGE_SIZE = 10

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AdminInventory() {
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [lowStockLimit, setLowStockLimit] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load inventory whenever filter, search text or page changes
  useEffect(() => {
    let cancelled = false

    async function loadInventory() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(PAGE_SIZE))
        if (lowStockOnly) params.set('lowStock', 'true')
        if (search) params.set('search', search)

        const res = await apiRequest(`/inventory/admin/all?${params.toString()}`)
        if (!cancelled) {
          setItems(res.data?.items || [])
          setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
          if (res.data?.lowStockLimit !== undefined) setLowStockLimit(res.data.lowStockLimit)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadInventory()
    return () => {
      cancelled = true
    }
  }, [lowStockOnly, search, page])

  const handleFilterChange = (value) => {
    setLowStockOnly(value)
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Inventory</h2>
      <p className="text-sm text-[#52647D] mt-1">
        Stock of every product variant. ({pagination.total} total)
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
        <button
          onClick={() => handleFilterChange(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !lowStockOnly
              ? 'bg-[#2864F0] text-white'
              : 'bg-white text-[#101A30] hover:bg-[#E4E4F2]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            lowStockOnly
              ? 'bg-[#2864F0] text-white'
              : 'bg-white text-[#101A30] hover:bg-[#E4E4F2]'
          }`}
        >
          Low stock (≤ {lowStockLimit})
        </button>
      </div>

      {/* Search box */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by product name, variant or SKU"
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

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-5 bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-6 text-[#52647D]">Loading inventory...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-[#52647D]">No inventory found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Available</th>
                <th className="px-6 py-4 font-medium">Reserved</th>
                <th className="px-6 py-4 font-medium">Sellable</th>
                <th className="px-6 py-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isOut = item.sellable <= 0
                const isLow = !isOut && item.sellable <= lowStockLimit

                return (
                  <tr key={item.variantId} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#101A30]">{item.productName || '-'}</p>
                      {item.variantName && (
                        <p className="text-xs text-[#52647D] mt-1">{item.variantName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#52647D]">{item.sku || '-'}</td>
                    <td className="px-6 py-4 text-[#101A30]">{item.shopName || '-'}</td>
                    <td className="px-6 py-4 text-[#101A30]">{item.quantityAvailable}</td>
                    <td className="px-6 py-4 text-[#52647D]">{item.quantityReserved}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
                          isOut
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : isLow
                            ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {item.sellable}
                        {isOut ? ' · Out' : isLow ? ' · Low' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#52647D]">{formatDate(item.updatedAt)}</td>
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

export default AdminInventory