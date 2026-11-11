// File: src/pages/AdminProducts.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

// Status filter tabs (value '' means all products)
const tabs = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const badgeColors = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  DRAFT: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200',
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

// Show lowest price, or a range if variants have different prices
function formatPrice(variants) {
  const prices = (variants || [])
    .map((v) => Number(v.price))
    .filter((n) => !Number.isNaN(n))
  if (prices.length === 0) return '-'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? `₹${min}` : `₹${min} - ₹${max}`
}

function AdminProducts() {
  const [activeTab, setActiveTab] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load products whenever status tab, search text or page changes
  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(PAGE_SIZE))
        if (activeTab) params.set('status', activeTab)
        if (search) params.set('q', search)

        const res = await apiRequest(`/products/admin/all?${params.toString()}`)
        if (!cancelled) {
          // This API returns data as an array and pagination at the top level
          setProducts(res.data || [])
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 })
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [activeTab, search, page])

  const handleTabChange = (value) => {
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">Products</h2>
      <p className="text-sm text-[#52647D] mt-1">
        View all products from every seller. ({pagination.total} total)
      </p>

      {/* Status tabs */}
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

      {/* Search box */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by product name or brand"
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
          <p className="p-6 text-[#52647D]">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-[#52647D]">No products found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#101A30]">{product.name}</p>
                    {product.brand && (
                      <p className="text-xs text-[#52647D] mt-1">{product.brand}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#101A30]">
                    {product.seller?.shopName || '-'}
                  </td>
                  <td className="px-6 py-4 text-[#52647D]">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-[#101A30]">
                    {formatPrice(product.variants)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
                        badgeColors[product.status] || ''
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#52647D]">
                    {formatDate(product.createdAt)}
                  </td>
                </tr>
              ))}
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

export default AdminProducts