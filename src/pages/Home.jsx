import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

// Get the cheapest active variant
function getStartingVariant(product) {
  const variants = (product.variants || [])
    .filter((variant) => Number(variant.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price))

  return variants[0] || null
}

function getProductImage(product) {
  const first = product.images?.[0]
  if (!first) return null
  if (typeof first === 'string') return first
  return first.url || first.imageUrl || null
}

function formatPrice(price) {
  return Number(price).toLocaleString('en-IN')
}
// Emoji icons for known categories (matched by name)
const categoryIcons = {
  fashion: '👗',
  beauty: '💄',
  electronics: '💻',
  footwear: '👟',
  'home & kitchen': '🏠',
  accessories: '👜',
}

function getCategoryIcon(name) {
  return categoryIcons[(name || '').trim().toLowerCase()] || null
}

function Home() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wishlistIds, setWishlistIds] = useState([])
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [processingId, setProcessingId] = useState('')

  const token = sessionStorage.getItem('accessToken')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [categoryRes, productRes] = await Promise.all([
          apiRequest('/categories'),
          apiRequest('/products'),
        ])

        if (cancelled) return

        setCategories(categoryRes.data || [])
        setProducts((productRes.data || []).slice(0, 8))
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  // Load customer's wishlist after login
  useEffect(() => {
    let cancelled = false

    async function loadWishlist() {
      if (!token) {
        setWishlistIds([])
        return
      }

      try {
        const response = await apiRequest('/wishlist')

        if (!cancelled) {
          setWishlistIds(
            (response.data || []).map((item) => item.product?.id).filter(Boolean)
          )
        }
      } catch (err) {
        console.error('Could not load wishlist:', err.message)
      }
    }

    loadWishlist()

    return () => {
      cancelled = true
    }
  }, [token])

  const requireLogin = () => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return false
    }
    return true
  }

  // Add or remove product from wishlist
  const handleWishlist = async (product) => {
    if (!requireLogin()) return

    setProcessingId(product.id)
    setActionMessage('')
    setActionError('')

    try {
      if (wishlistIds.includes(product.id)) {
        await apiRequest(`/wishlist/${product.id}`, {
          method: 'DELETE',
        })

        setWishlistIds((previous) =>
          previous.filter((id) => id !== product.id)
        )
        setActionMessage('Removed from wishlist.')
      } else {
        await apiRequest(`/wishlist/${product.id}`, {
          method: 'POST',
        })

        setWishlistIds((previous) => [...previous, product.id])
        setActionMessage('Added to wishlist successfully!')
      }
    } catch (err) {
      setActionError(err.message || 'Wishlist action failed.')
    } finally {
      setProcessingId('')
    }
  }

  // Add selected product variant to cart
  const handleAddToCart = async (product) => {
    if (!requireLogin()) return

    const variant = getStartingVariant(product)

    if (!variant) {
      setActionError('No available product variant.')
      return
    }

    setProcessingId(product.id)
    setActionMessage('')
    setActionError('')

    try {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          variantId: variant.id,
          quantity: 1,
        }),
      })

      setActionMessage('Product added to cart successfully!')
    } catch (err) {
      setActionError(err.message || 'Could not add product to cart.')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Hero Section */}
        <section className="bg-[#F0F0F8] rounded-2xl mt-8 mb-12 overflow-hidden">
          <div className="px-6 md:px-12 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <span className="text-[#2864F0] font-semibold text-sm">
                WELCOME TO QNAYDS
              </span>

              <h1 className="text-4xl md:text-6xl font-bold text-[#101A30] mt-5 leading-tight">
                Discover Your
                <span className="text-[#2864F0]"> Favourite </span>
                Products
              </h1>

              <p className="text-[#52647D] mt-5 text-base md:text-lg">
                Shop your favourite products with amazing deals
                and a better shopping experience.
              </p>

              <Link
                to="/products"
                className="inline-block mt-8 bg-[#2864F0] text-white px-8 py-3 rounded-lg hover:bg-[#2878C8] transition"
              >
                Shop Now →
              </Link>
            </div>

            <div className="w-full md:w-1/2 bg-white rounded-2xl p-10 md:p-14 text-center shadow-sm">
              <div className="text-7xl mb-5">🛍️</div>
              <h2 className="text-2xl font-bold text-[#101A30]">
                Shopping Made Easy
              </h2>
              <p className="text-[#52647D] mt-3">
                Explore products and enjoy great offers.
              </p>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            Could not load data: {error}
          </div>
        )}

        {/* Action Messages */}
        {actionMessage && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {actionError}
          </div>
        )}

        {/* Categories */}
        <section className="pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#101A30]">
                Shop by Category
              </h2>
              <p className="text-sm text-[#52647D] mt-1">
                Explore our popular categories
              </p>
            </div>

            <Link
              to="/categories"
              className="text-sm font-semibold text-[#2864F0] hover:text-[#2878C8]"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-[#52647D] py-6">Loading categories...</p>
          ) : categories.length === 0 ? (
            <div className="bg-[#F0F0F8] rounded-xl p-8 text-center">
              <p className="text-[#52647D]">No categories available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {categories.map((category) => {
                const icon = getCategoryIcon(category.name)

                return (
                  <Link
                    key={category.id}
                    to={`/products?categoryId=${category.id}`}
                    className="group bg-[#F0F0F8] rounded-xl py-6 px-4 text-center border border-transparent hover:border-[#2864F0] hover:shadow-md transition-all"
                  >
                    <div className="h-14 flex items-center justify-center">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          loading="lazy"
                          className="h-14 w-14 object-cover rounded-full group-hover:scale-110 transition-transform"
                        />
                      ) : icon ? (
                        <span className="text-5xl group-hover:scale-110 transition-transform">
                          {icon}
                        </span>
                      ) : (
                        <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#2864F0]">
                          {category.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-[#101A30] mt-3 group-hover:text-[#2864F0]">
                      {category.name}
                    </h3>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Products For You */}
        <section className="pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#101A30]">
                Products For You
              </h2>
              <p className="text-sm text-[#52647D] mt-1">
                Discover our latest products
              </p>
            </div>

            <Link
              to="/products"
              className="text-sm font-semibold text-[#2864F0] hover:text-[#2878C8]"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-[#52647D] py-6">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="bg-[#F0F0F8] rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-semibold text-[#101A30]">
                No Products Available
              </h3>
              <p className="text-sm text-[#52647D] mt-2">
                Products will appear here when they are available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => {
                const image = getProductImage(product)
                const variant = getStartingVariant(product)
                const price = variant ? Number(variant.price) : null
                const isWishlisted = wishlistIds.includes(product.id)
                const isProcessing = processingId === product.id

                return (
                  <div
                    key={product.id}
                    className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#2864F0]/30 transition-all"
                  >
                    {/* Product Image */}
                    <div className="relative h-40 sm:h-48 md:h-56 bg-[#F0F0F8] flex items-center justify-center overflow-hidden p-4">
                      <Link to={`/product/${product.id}`} className="w-full h-full flex items-center justify-center">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-5xl">📦</div>
                        )}
                      </Link>

                      {product.brand && (
                        <span className="absolute top-3 left-3 bg-white px-2 py-1 rounded-md text-xs font-semibold text-[#2878C8]">
                          {product.brand}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleWishlist(product)}
                        disabled={isProcessing}
                        aria-label="Toggle wishlist"
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-xl transition ${
                          isWishlisted ? 'text-red-500' : 'text-[#52647D]'
                        }`}
                      >
                        {isWishlisted ? '♥' : '♡'}
                      </button>
                    </div>

                    {/* Product Details */}
                    <div className="p-3 md:p-4">
                      <h3 className="text-sm md:text-base font-semibold text-[#101A30] line-clamp-2 min-h-10">
                        {product.name}
                      </h3>

                      <div className="mt-2">
                        {price !== null ? (
                          <>
                            <p className="text-xs text-[#52647D]">
                              Starting from
                            </p>
                            <p className="text-lg md:text-xl font-bold text-[#101A30]">
                              ₹{formatPrice(price)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-[#52647D]">
                            Price unavailable
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={isProcessing || !variant}
                        className="w-full mt-4 bg-[#2864F0] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2878C8] transition disabled:opacity-50"
                      >
                        {isProcessing ? 'Please wait...' : '🛒 Add to Cart'}
                      </button>

                      <Link
                        to={`/product/${product.id}`}
                        className="block w-full mt-2 text-center border border-[#2864F0] text-[#2864F0] py-2 rounded-lg text-sm font-semibold hover:bg-[#F0F0F8] transition"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Home