import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

const emptyForm = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
}

function Checkout() {
  const navigate = useNavigate()

  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  // Load cart and addresses
  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return
    }

    async function load() {
      try {
        const [cartRes, addrRes] = await Promise.all([
          apiRequest('/cart'),
          apiRequest('/addresses'),
        ])
        setCart(cartRes.data)
        const list = addrRes.data || []
        setAddresses(list)
        const def = list.find((a) => a.isDefault) || list[0]
        if (def) setSelectedId(def.id)
        else setShowForm(true)
      } catch (err) {
        setError(err.message || 'Could not load checkout')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Save a new address
  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = { ...form, country: 'India' }
      if (!body.addressLine2) delete body.addressLine2
      const res = await apiRequest('/addresses', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const created = res.data
      setAddresses((prev) => [...prev, created])
      setSelectedId(created.id)
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Could not save address')
    } finally {
      setSaving(false)
    }
  }

  // Place the order
  const handlePlaceOrder = async () => {
    if (!selectedId) {
      setError('Please select a delivery address.')
      return
    }
    setPlacing(true)
    setError('')
    try {
        await apiRequest('/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ addressId: selectedId }),
      })
      navigate('/orders')
    } catch (err) {
      setError(err.message || 'Could not place order')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F0F0F8]">
        <p className="text-[#52647D]">Loading checkout...</p>
      </div>
    )
  }

  const items = cart?.items || []

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#F0F0F8] px-4 text-center">
        <div className="text-6xl">🛒</div>
        <h2 className="text-2xl font-bold text-[#101A30]">Your cart is empty</h2>
        <Link to="/" className="bg-[#2864F0] text-white px-6 py-3 rounded-lg">
          Continue Shopping
        </Link>
      </div>
    )
  }

  const inputClass =
    'w-full bg-[#F0F0F8] px-4 py-3 rounded-lg outline-none text-sm text-[#101A30]'

  return (
    <div className="bg-[#F0F0F8] min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#101A30] mb-6">Checkout</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Address section */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#101A30] mb-4">
              Delivery Address
            </h2>

            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex gap-3 border rounded-lg p-4 mb-3 cursor-pointer ${
                  selectedId === a.id
                    ? 'border-[#2864F0] bg-[#2864F0]/5'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                />
                <div className="text-sm text-[#52647D]">
                  <p className="font-semibold text-[#101A30]">
                    {a.recipientName} · {a.phone}
                  </p>
                  <p>
                    {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                  </p>
                  <p>
                    {a.city}, {a.state} - {a.postalCode}
                  </p>
                </div>
              </label>
            ))}

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-[#2864F0] font-semibold text-sm"
              >
                + Add new address
              </button>
            )}

            {showForm && (
              <form onSubmit={handleSaveAddress} className="mt-2 space-y-3">
                <input
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  className={inputClass}
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                  className={inputClass}
                />
                <input
                  name="addressLine1"
                  value={form.addressLine1}
                  onChange={handleChange}
                  placeholder="Address line 1"
                  required
                  className={inputClass}
                />
                <input
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleChange}
                  placeholder="Address line 2 (optional)"
                  className={inputClass}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                    className={inputClass}
                  />
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    required
                    className={inputClass}
                  />
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    placeholder="PIN code"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#2864F0] text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Address'}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-2.5 rounded-lg text-sm border border-gray-300 text-[#101A30]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-xl p-6 h-fit">
            <h2 className="text-lg font-bold text-[#101A30] mb-4">
              Order Summary
            </h2>

            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm text-[#52647D] mb-2"
              >
                <span className="truncate pr-2">
                  {item.product?.name} × {item.quantity}
                </span>
                <span>₹{Number(item.lineTotal).toLocaleString('en-IN')}</span>
              </div>
            ))}

            <div className="border-t mt-3 pt-3 flex justify-between font-bold text-[#101A30]">
              <span>Total</span>
              <span>₹{Number(cart.subtotal).toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || cart.hasIssues}
              className="w-full mt-5 bg-[#2864F0] text-white py-3 rounded-lg font-semibold hover:bg-[#2878C8] disabled:opacity-50"
            >
              {placing ? 'Placing order...' : 'Place Order'}
            </button>

            {cart.hasIssues && (
              <p className="text-xs text-red-500 mt-2">
                Some items are unavailable. Please update your cart.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout