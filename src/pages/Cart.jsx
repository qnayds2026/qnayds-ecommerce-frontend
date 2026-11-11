
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCart = async () => {
    try {
      const response = await apiRequest('/cart')
      setCart(response.data)
    } catch (err) {
      setError(err.message || 'Unable to load cart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return
    }
    loadCart()
  }, [])

  const updateQuantity = async (item, quantity) => {
    try {
      const response = await apiRequest(`/cart/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      })
      setCart(response.data)
    } catch (err) {
      setError(err.message)
    }
  }

  const removeItem = async (itemId) => {
    try {
      const response = await apiRequest(`/cart/items/${itemId}`, {
        method: 'DELETE',
      })
      await loadCart()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="p-10 text-center">Loading cart...</div>
  }

  if (error && !cart) {
    return <div className="p-10 text-center text-red-500">{error}</div>
  }

  if (!cart?.items?.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-[#101A30]">Your Cart is Empty</h2>
        <p className="text-[#52647D] mt-2">Looks like you haven't added anything yet.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-[#2864F0] text-white px-6 py-3 rounded-lg"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#F0F0F8] min-h-[60vh] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#101A30] mb-8">Shopping Cart</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-5 flex flex-col sm:flex-row gap-5">
                <div className="w-28 h-28 bg-[#F0F0F8] rounded-lg flex items-center justify-center text-4xl shrink-0">
                  {item.product?.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : '📦'}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-[#101A30] text-lg">
                    {item.product?.name}
                  </h3>
                  <p className="text-sm text-[#52647D] mt-1">
                    {item.variant?.name || item.variant?.sku || 'Standard Variant'}
                  </p>

                  <p className="text-[#2864F0] font-bold mt-2">
                    ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <div className="flex items-center border rounded-lg">
                      <button
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item, item.quantity - 1)}
                        className="px-3 py-1 disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="px-3">{item.quantity}</span>
                      <button
                        disabled={item.quantity >= item.availableStock}
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        className="px-3 py-1 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-[#52647D]">Total</p>
                  <p className="font-bold text-[#101A30] text-lg">
                    ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold text-[#101A30] mb-5">Price Details</h2>

            <div className="flex justify-between mb-3 text-[#52647D]">
              <span>Items ({cart.itemCount})</span>
              <span>₹{Number(cart.subtotal).toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t pt-4 flex justify-between font-bold text-lg text-[#101A30]">
              <span>Total Amount</span>
              <span>₹{Number(cart.subtotal).toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-6 bg-[#2864F0] text-white py-3 rounded-lg hover:bg-[#2878C8]"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
