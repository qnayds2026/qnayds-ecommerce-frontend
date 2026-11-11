import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../services/api'

function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  // Load the product
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await apiRequest(`/products/${id}`)
        const data = res?.data
        setProduct(data)

        // Select the first active variant by default
        const firstActive =
          data?.variants?.find((v) => v.isActive) || data?.variants?.[0]
        setSelectedVariantId(firstActive?.id || null)
      } catch (err) {
        setError(err.message || 'Unable to load product')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  // Check whether this product is already in the wishlist
  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) return
    apiRequest('/wishlist')
      .then((res) => {
        const list = res?.data?.items || res?.data || []
        const found = Array.isArray(list)
          ? list.some(
              (w) => (w.productId || w.product?.id || w.id) === id
            )
          : false
        setWishlisted(found)
      })
      .catch(() => {})
  }, [id])

  const variants = product?.variants || []
  const selectedVariant = variants.find((v) => v.id === selectedVariantId)

  const getStock = (variant) =>
    Math.max(
      0,
      (variant?.inventory?.quantityAvailable ?? 0) -
        (variant?.inventory?.quantityReserved ?? 0)
    )

  const stock = getStock(selectedVariant)
  const price = Number(selectedVariant?.price || 0)
  const comparePrice = Number(selectedVariant?.compareAtPrice || 0)
  const discount =
    comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0

  const firstImage = product?.images?.[0]
  const imageUrl =
    typeof firstImage === 'string' ? firstImage : firstImage?.url || ''

  const requireLogin = () => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return true
    }
    return false
  }

  const handleAddToCart = async () => {
    if (requireLogin()) return
    if (!selectedVariantId) return
    try {
      setAdding(true)
      setMessage('')
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId: selectedVariantId, quantity: 1 }),
      })
      setMessage('Added to cart')
    } catch (err) {
      setMessage(err.message || 'Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    if (sessionStorage.getItem('accessToken')) navigate('/cart')
  }

  const handleWishlist = async () => {
    if (requireLogin()) return
    try {
      if (wishlisted) {
        await apiRequest(`/wishlist/${id}`, { method: 'DELETE' })
        setWishlisted(false)
      } else {
        await apiRequest(`/wishlist/${id}`, { method: 'POST' })
        setWishlisted(true)
      }
    } catch (err) {
      setMessage(err.message || 'Wishlist update failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F0F0F8]">
        <p className="text-[#52647D]">Loading product...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#F0F0F8] px-4 text-center">
        <p className="text-red-500">{error || 'Product not found'}</p>
        <Link
          to="/"
          className="bg-[#2864F0] text-white px-6 py-3 rounded-lg"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-[#F0F0F8] min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <p className="text-sm text-[#52647D] mb-4">
          <Link to="/" className="hover:text-[#2864F0]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#101A30]">{product.name}</span>
        </p>

        <div className="bg-white rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Image */}
          <div className="bg-[#F0F0F8] rounded-xl aspect-square flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl">📦</span>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <p className="text-sm font-semibold text-[#2864F0] uppercase">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-[#101A30] mt-1">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-end gap-3 mt-4">
              <p className="text-3xl font-bold text-[#101A30]">
                ₹{price.toLocaleString('en-IN')}
              </p>
              {discount > 0 && (
                <>
                  <p className="text-lg text-[#52647D] line-through">
                    ₹{comparePrice.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    {discount}% off
                  </p>
                </>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-[#101A30] mb-2">
                  Select Variant
                </p>
                <div className="flex flex-wrap gap-3">
                  {variants.map((v) => {
                    const active = v.id === selectedVariantId
                    const vStock = getStock(v)
                    return (
                      <button
                        key={v.id}
                        disabled={!v.isActive}
                        onClick={() => {
                          setSelectedVariantId(v.id)
                          setMessage('')
                        }}
                        className={`px-4 py-2 rounded-lg border text-sm text-left transition disabled:opacity-40 ${
                          active
                            ? 'border-[#2864F0] bg-[#2864F0]/10 text-[#2864F0]'
                            : 'border-gray-300 text-[#101A30] hover:border-[#2864F0]'
                        }`}
                      >
                        <span className="block font-medium">
                          {v.name || v.sku}
                        </span>
                        <span className="block text-xs">
                          ₹{Number(v.price).toLocaleString('en-IN')}
                          {vStock === 0 ? ' · Out of stock' : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stock */}
            <p
              className={`mt-4 text-sm font-medium ${
                stock === 0
                  ? 'text-red-500'
                  : stock <= 5
                  ? 'text-orange-500'
                  : 'text-green-600'
              }`}
            >
              {stock === 0
                ? 'Out of stock'
                : stock <= 5
                ? `Only ${stock} left`
                : 'In stock'}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={adding || stock === 0}
                className="flex-1 min-w-[140px] bg-[#2864F0] hover:bg-[#2878C8] text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding || stock === 0}
                className="flex-1 min-w-[140px] border border-[#2864F0] text-[#2864F0] hover:bg-[#2864F0] hover:text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Buy Now
              </button>
              <button
                onClick={handleWishlist}
                className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center text-xl hover:border-[#2864F0]"
                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <span className={wishlisted ? 'text-red-500' : 'text-[#52647D]'}>
                  {wishlisted ? '♥' : '♡'}
                </span>
              </button>
            </div>

            {message && (
              <p className="mt-3 text-sm text-[#52647D]">{message}</p>
            )}

            {/* Description */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="font-semibold text-[#101A30] mb-2">
                Product Description
              </h2>
              <p className="text-sm text-[#52647D]">
                {product.description || 'No description available.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails