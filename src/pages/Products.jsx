// File: src/pages/Products.jsx

import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../services/api'

function getStartingPrice(product) {
  const prices = (product.variants || [])
    .map((v) => Number(v.price))
    .filter((p) => !Number.isNaN(p))
  return prices.length ? Math.min(...prices) : null
}

function getProductImage(product) {
  const first = product.images?.[0]
  if (!first) return null
  if (typeof first === 'string') return first
  return first.url || first.imageUrl || null
}

// Pick the cheapest variant with a valid price
function getStartingVariant(product) {
  const variants = (product.variants || [])
    .filter((v) => Number(v.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price))
  return variants[0] || null
}

function Products() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters live in the URL: /products?q=shoes&categoryId=abc&page=2
  const q = searchParams.get('q') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [searchText, setSearchText] = useState(q)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [addingId, setAddingId] = useState('')

  // Keep the search box in sync when the URL changes
  useEffect(() => {
    setSearchText(q)
  }, [q])

  // Load categories once
  useEffect(() => {
    apiRequest('/categories')
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  // Load products whenever filters or page change
  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ page: String(page), limit: '12' })
        if (q) params.set('q', q)
        if (categoryId) params.set('categoryId', categoryId)

        const res = await apiRequest(`/products?${params.toString()}`)
        if (cancelled) return
        setProducts(res.data || [])
        setPagination(res.pagination || null)
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
  }, [q, categoryId, page])

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setSearchParams(next)
  }

  function handleSearch(e) {
    e.preventDefault()
    updateParams({ q: searchText.trim(), page: '' })
  }

  function clearFilters() {
    setSearchText('')
    setSearchParams({})
  }

  // Add the cheapest variant of a product to the cart
  async function handleAddToCart(product) {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return
    }

    const variant = getStartingVariant(product)
    if (!variant) {
      setMessage('No available variant.')
      return
    }

    try {
      setAddingId(product.id)
      setMessage('')
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId: variant.id, quantity: 1 }),
      })
      setMessage('Product added to cart!')
    } catch (err) {
      setMessage(err.message || 'Could not add to cart')
    } finally {
      setAddingId('')
    }
  }

  const hasFilters = q || categoryId
  const totalPages = pagination?.totalPages || 1

  return (
    <div className="bg-white min-h-screen">
      {/* Page header */}
      <section className="bg-[#F0F0F8]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-[#101A30]">All Products</h1>
          <p className="text-[#52647D] mt-2">
            {pagination
              ? `${pagination.total} product${pagination.total === 1 ? '' : 's'} found`
              : 'Browse our collection'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <form onSubmit={handleSearch} className="flex flex-1">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-[#F0F0F8] px-4 py-3 rounded-l-lg outline-none text-[#101A30]"
            />
            <button
              type="submit"
              className="bg-[#2864F0] text-white px-6 rounded-r-lg hover:bg-[#2878C8]"
            >
              Search
            </button>
          </form>

          <select
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value, page: '' })}
            className="bg-[#F0F0F8] px-4 py-3 rounded-lg text-[#101A30] outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[#2864F0] font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Action message */}
        {message && (
          <div className="mt-6 rounded-lg bg-[#F0F0F8] text-[#101A30] px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            Could not load products: {error}
          </div>
        )}

        {/* Products grid */}
        <div className="mt-8">
          {loading ? (
            <p className="text-[#52647D]">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-[#101A30]">
                No products found
              </h3>
              <p className="text-[#52647D] mt-2">
                Try a different search or category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const image = getProductImage(product)
                const price = getStartingPrice(product)
                const isAdding = addingId === product.id

                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Product image */}
                    <Link
                      to={`/product/${product.id}`}
                      className="bg-[#F0F0F8] h-56 p-5 flex items-center justify-center"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-5xl">📦</span>
                      )}
                    </Link>

                    {/* Product details */}
                    <div className="p-5">
                      {product.brand && (
                        <p className="text-xs font-semibold uppercase text-[#2878C8]">
                          {product.brand}
                        </p>
                      )}

                      <h3 className="font-semibold text-[#101A30] mt-1">
                        <Link
                          to={`/product/${product.id}`}
                          className="hover:text-[#2864F0]"
                        >
                          {product.name}
                        </Link>
                      </h3>

                      <div className="mt-3">
                        {price !== null ? (
                          <span className="text-xl font-bold text-[#101A30]">
                            <span className="text-sm font-normal text-[#52647D]">
                              From{' '}
                            </span>
                            ₹{price}
                          </span>
                        ) : (
                          <span className="text-sm text-[#52647D]">
                            Price unavailable
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isAdding}
                        className="w-full mt-4 bg-[#2864F0] text-white py-3 rounded-lg hover:bg-[#2878C8] disabled:opacity-50"
                      >
                        {isAdding ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="px-5 py-2 rounded-lg bg-[#F0F0F8] text-[#101A30] disabled:opacity-40 hover:bg-[#2864F0] hover:text-white disabled:hover:bg-[#F0F0F8] disabled:hover:text-[#101A30]"
            >
              ← Previous
            </button>

            <span className="text-[#52647D]">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="px-5 py-2 rounded-lg bg-[#F0F0F8] text-[#101A30] disabled:opacity-40 hover:bg-[#2864F0] hover:text-white disabled:hover:bg-[#F0F0F8] disabled:hover:text-[#101A30]"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products