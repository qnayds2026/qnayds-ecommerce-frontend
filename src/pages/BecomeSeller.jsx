// File: src/pages/BecomeSeller.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api'

// Message shown for each application status
const statusInfo = {
  PENDING: {
    title: 'Application under review',
    text: 'Your seller application has been submitted. Please wait for admin approval.',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  APPROVED: {
    title: 'Application approved',
    text: 'Your seller account is approved. Please logout and login again to open your Seller Dashboard.',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
  REJECTED: {
    title: 'Application rejected',
    text: 'Your seller application was rejected. Please contact support for more details.',
    color: 'bg-red-50 border-red-200 text-red-700',
  },
  SUSPENDED: {
    title: 'Seller account suspended',
    text: 'Your seller account is suspended. Please contact support.',
    color: 'bg-red-50 border-red-200 text-red-700',
  },
}

function BecomeSeller() {
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Check if the user already has a seller profile
  useEffect(() => {
    let cancelled = false

    async function loadSeller() {
      try {
        setLoading(true)
        setLoadError('')
        const res = await apiRequest('/sellers/me')
        if (!cancelled) setSeller(res.data)
      } catch (err) {
        if (cancelled) return
        // 404 means no profile yet, so the form is shown
        if (err.status === 404) {
          setSeller(null)
        } else {
          setLoadError(err.message || 'Something went wrong')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSeller()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const name = shopName.trim()
    if (name.length < 2) {
      setSubmitError('Shop name must be at least 2 characters.')
      return
    }

    const body = { shopName: name }
    if (description.trim()) body.description = description.trim()

    try {
      setSubmitting(true)
      const res = await apiRequest('/sellers', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setSeller(res.data)
    } catch (err) {
      setSubmitError(err.message || 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  const info = seller ? statusInfo[seller.status] : null

  return (
    <div className="bg-[#F0F0F8] min-h-[60vh] py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#101A30]">Become a Seller</h1>
        <p className="text-sm text-[#52647D] mt-1">
          Start selling your products on Qnayds.
        </p>

        {loading ? (
          <p className="text-[#52647D] mt-6">Loading...</p>
        ) : loadError ? (
          <div className="mt-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {loadError}
          </div>
        ) : seller ? (
          <div className="mt-6">
            <div className={`rounded-lg border px-4 py-4 ${info?.color || ''}`}>
              <p className="font-semibold">{info?.title || seller.status}</p>
              <p className="text-sm mt-1">{info?.text}</p>
            </div>

            <div className="mt-5 text-sm text-[#52647D]">
              <p>
                <span className="font-semibold text-[#101A30]">Shop name: </span>
                {seller.shopName}
              </p>
              {seller.description && (
                <p className="mt-1">
                  <span className="font-semibold text-[#101A30]">Description: </span>
                  {seller.description}
                </p>
              )}
            </div>

            <Link
              to="/"
              className="inline-block mt-6 text-sm font-semibold text-[#2864F0] hover:text-[#2878C8]"
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {submitError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#101A30] mb-2">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                maxLength={100}
                placeholder="Enter your shop name"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#101A30] mb-2">
                Description <span className="font-normal text-[#52647D]">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Tell customers about your shop"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2864F0] hover:bg-[#2878C8] text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default BecomeSeller