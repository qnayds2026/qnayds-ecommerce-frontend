import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function Wishlist() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadWishlist = async () => {
    try {
      setError('')
      const response = await apiRequest('/wishlist')
      setItems(response.data || [])
    } catch (err) {
      setError(err.message || 'Unable to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return
    }

    loadWishlist()
  }, [])

  const removeItem = async (productId) => {
    try {
      await apiRequest(`/wishlist/${productId}`, {
        method: 'DELETE',
      })

      setItems((currentItems) =>
        currentItems.filter((item) => item.product.id !== productId)
      )
    } catch (err) {
      setError(err.message || 'Unable to remove product')
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F0F8] py-10 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#101A30]">
              My Wishlist ❤️
            </h1>
            <p className="text-[#52647D] mt-2">
              Your favourite products
            </p>
          </div>

          <Link
            to="/customer"
            className="text-[#2864F0] font-semibold hover:underline"
          >
            ← Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#52647D]">
            Loading wishlist...
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
            <button
              onClick={loadWishlist}
              className="ml-3 underline font-semibold"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-5">♡</div>
            <h2 className="text-2xl font-bold text-[#101A30]">
              Your Wishlist is Empty
            </h2>
            <p className="text-[#52647D] mt-3">
              Save your favourite products here.
            </p>

            <Link
              to="/customer"
              className="inline-block mt-6 bg-[#2864F0] text-white px-8 py-3 rounded-lg hover:bg-[#2878C8]"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[#52647D] mb-5">
              {items.length} saved product(s)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((item) => {
                const product = item.product

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                  >
                    <div className="h-56 bg-[#F0F0F8] flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-6xl">📦</span>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-[#101A30]">
                        {product.name}
                      </h3>

                      <p className="text-xl font-bold text-[#101A30] mt-3">
                        {product.startingPrice != null
                          ? `₹${product.startingPrice}`
                          : 'Price unavailable'}
                      </p>

                      {!product.available && (
                        <p className="text-sm text-red-500 mt-2">
                          Currently unavailable
                        </p>
                      )}

                      <button
                        onClick={() => removeItem(product.id)}
                        className="w-full mt-5 border border-red-200 text-red-500 py-2.5 rounded-lg hover:bg-red-50"
                      >
                        ♥ Remove from Wishlist
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Wishlist