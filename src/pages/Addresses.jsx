import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function Addresses() {
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAddresses = async () => {
    try {
      const res = await apiRequest('/addresses')
      setAddresses(res.data || [])
    } catch (err) {
      setError(err.message || 'Could not load addresses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return
    }
    loadAddresses()
  }, [navigate])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  const openEdit = (a) => {
    setForm({
      recipientName: a.recipientName || '',
      phone: a.phone || '',
      addressLine1: a.addressLine1 || '',
      addressLine2: a.addressLine2 || '',
      city: a.city || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
    })
    setEditingId(a.id)
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = { ...form }
      if (!body.addressLine2) delete body.addressLine2

      if (editingId) {
        await apiRequest(`/addresses/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        await apiRequest('/addresses', {
          method: 'POST',
          body: JSON.stringify({ ...body, country: 'India' }),
        })
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadAddresses()
    } catch (err) {
      setError(err.message || 'Could not save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return
    try {
      await apiRequest(`/addresses/${id}`, { method: 'DELETE' })
      await loadAddresses()
    } catch (err) {
      setError(err.message || 'Could not delete address')
    }
  }

  const inputClass =
    'w-full bg-[#F0F0F8] px-4 py-3 rounded-lg outline-none text-sm text-[#101A30]'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F0F0F8]">
        <p className="text-[#52647D]">Loading addresses...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#F0F0F8] min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#101A30]">Saved Addresses</h1>
          {!showForm && (
            <button
              onClick={openAdd}
              className="bg-[#2864F0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2878C8]"
            >
              + Add Address
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 mb-6 space-y-3"
          >
            <h2 className="font-bold text-[#101A30]">
              {editingId ? 'Edit Address' : 'New Address'}
            </h2>
            <input name="recipientName" value={form.recipientName} onChange={handleChange} placeholder="Full name" required className={inputClass} />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" required className={inputClass} />
            <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Address line 1" required className={inputClass} />
            <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Address line 2 (optional)" className={inputClass} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input name="city" value={form.city} onChange={handleChange} placeholder="City" required className={inputClass} />
              <input name="state" value={form.state} onChange={handleChange} placeholder="State" required className={inputClass} />
              <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="PIN code" required className={inputClass} />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#2864F0] text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-lg text-sm border border-gray-300 text-[#101A30]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !showForm && (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-5xl mb-3">📍</div>
            <p className="text-[#52647D]">No saved addresses yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-xl p-5 flex justify-between gap-4">
              <div className="text-sm text-[#52647D]">
                <p className="font-semibold text-[#101A30]">
                  {a.recipientName} · {a.phone}
                  {a.isDefault && (
                    <span className="ml-2 text-xs bg-[#2864F0]/10 text-[#2864F0] px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </p>
                <p>
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                </p>
                <p>
                  {a.city}, {a.state} - {a.postalCode}
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm shrink-0">
                <button onClick={() => openEdit(a)} className="text-[#2864F0] font-semibold">
                  Edit
                </button>
                <button onClick={() => handleDelete(a.id)} className="text-red-600 font-semibold">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Addresses