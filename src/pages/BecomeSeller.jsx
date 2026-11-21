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

// ID proof types. The rules match the backend validation (UX only, the backend is the final check).
const ID_TYPES = [
  {
    value: 'PAN',
    label: 'PAN Card',
    placeholder: 'ABCDE1234F',
    regex: /^[A-Z]{5}\d{4}[A-Z]$/,
    message: 'Invalid PAN number',
  },
  {
    value: 'AADHAAR',
    label: 'Aadhaar',
    placeholder: '1234 5678 9012',
    regex: /^\d{12}$/,
    message: 'Aadhaar number must be 12 digits',
    hint: 'Only the last 4 digits are stored.',
  },
  {
    value: 'VOTER_ID',
    label: 'Voter ID',
    placeholder: 'ABC1234567',
    regex: /^[A-Z]{3}\d{7}$/,
    message: 'Invalid Voter ID number',
  },
  {
    value: 'DRIVING_LICENCE',
    label: 'Driving Licence',
    placeholder: 'KL0720110012345',
    regex: /^[A-Z]{2}\d{2}[0-9A-Z]{9,13}$/,
    message: 'Invalid driving licence number',
  },
  {
    value: 'PASSPORT',
    label: 'Passport',
    placeholder: 'A1234567',
    regex: /^[A-Z]\d{7}$/,
    message: 'Invalid passport number',
  },
]

const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const PIN_REGEX = /^[1-9]\d{5}$/

const emptyForm = {
  shopName: '',
  description: '',
  gstNumber: '',
  idProofType: '',
  idProofNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
}

// Same cleanup as the backend: uppercase, no spaces or hyphens
const normalizeId = (value) => value.trim().toUpperCase().replace(/[\s-]/g, '')

function validate(form) {
  const errors = {}

  if (form.shopName.trim().length < 2) {
    errors.shopName = 'Shop name must be at least 2 characters.'
  }

  const gst = form.gstNumber.trim().toUpperCase()
  if (gst && !GST_REGEX.test(gst)) {
    errors.gstNumber = 'Invalid GST number'
  }

  const idType = ID_TYPES.find((t) => t.value === form.idProofType)
  if (!idType) {
    errors.idProofType = 'Please select an ID proof type.'
  } else {
    const number = normalizeId(form.idProofNumber)
    if (!number) {
      errors.idProofNumber = 'ID proof number is required'
    } else if (!idType.regex.test(number)) {
      errors.idProofNumber = idType.message
    }
  }

  if (form.addressLine1.trim().length < 3) errors.addressLine1 = 'Address is required'
  if (form.city.trim().length < 2) errors.city = 'City is required'
  if (form.state.trim().length < 2) errors.state = 'State is required'

  if (!PIN_REGEX.test(form.postalCode.trim())) {
    errors.postalCode = 'Invalid PIN code'
  }

  return errors
}

// Backend sends: { message: "Validation failed", errors: [{ field, message }] }
function extractFieldErrors(err) {
  const list = err?.errors || err?.data?.errors || err?.response?.data?.errors
  if (!Array.isArray(list)) return {}

  const result = {}
  for (const item of list) {
    if (item?.field && !result[item.field]) result[item.field] = item.message
  }
  return result
}

const inputClass = (hasError) =>
  `w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-[#2864F0] focus:ring-[#2864F0]/10'
  }`

function Field({ label, optional, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#101A30] mb-2">
        {label}
        {optional && <span className="font-normal text-[#52647D]"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#52647D] mt-1">{hint}</p>
      ) : null}
    </div>
  )
}

function DetailRow({ label, children }) {
  return (
    <p className="mt-1">
      <span className="font-semibold text-[#101A30]">{label}: </span>
      {children}
    </p>
  )
}

function SellerDetails({ seller }) {
  const idType = ID_TYPES.find((t) => t.value === seller.idProofType)
  // The API returns the ID number masked. For Aadhaar only the last 4 digits exist.
  const idNumber =
    seller.idProofType === 'AADHAAR' && seller.idProofNumber
      ? `XXXX XXXX ${seller.idProofNumber}`
      : seller.idProofNumber

  const addressParts = [
    seller.addressLine1,
    seller.addressLine2,
    seller.city,
    seller.state,
    seller.postalCode,
    seller.country,
  ].filter(Boolean)

  return (
    <div className="mt-5 text-sm text-[#52647D]">
      <DetailRow label="Shop name">{seller.shopName}</DetailRow>
      {seller.description && <DetailRow label="Description">{seller.description}</DetailRow>}
      {seller.gstNumber && <DetailRow label="GST number">{seller.gstNumber}</DetailRow>}
      {seller.idProofType && (
        <DetailRow label={idType?.label || 'ID proof'}>{idNumber}</DetailRow>
      )}
      {addressParts.length > 0 && (
        <DetailRow label="Address">{addressParts.join(', ')}</DetailRow>
      )}
    </div>
  )
}

function BecomeSeller() {
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
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

  // Update one field and clear its error
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  // A different ID type has a different format, so the old number is cleared
  const handleIdTypeChange = (value) => {
    setForm((prev) => ({ ...prev, idProofType: value, idProofNumber: '' }))
    setFieldErrors((prev) => ({ ...prev, idProofType: '', idProofNumber: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSubmitError('Please fix the highlighted fields.')
      return
    }
    setFieldErrors({})

    // Optional fields are sent only when filled
    const body = {
      shopName: form.shopName.trim(),
      idProofType: form.idProofType,
      idProofNumber: normalizeId(form.idProofNumber),
      addressLine1: form.addressLine1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
    }
    if (form.description.trim()) body.description = form.description.trim()
    if (form.gstNumber.trim()) body.gstNumber = form.gstNumber.trim().toUpperCase()
    if (form.addressLine2.trim()) body.addressLine2 = form.addressLine2.trim()

    try {
      setSubmitting(true)
      const res = await apiRequest('/sellers', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setSeller(res.data)
    } catch (err) {
      // Already applied (for example a double click): show the existing application
      if (err.status === 409) {
        try {
          const existing = await apiRequest('/sellers/me')
          setSeller(existing.data)
          return
        } catch {
          setSubmitError('You have already applied. Please refresh the page.')
          return
        }
      }

      const backendErrors = extractFieldErrors(err)
      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors)
        setSubmitError('Please fix the highlighted fields.')
      } else {
        setSubmitError(err.message || 'Could not submit application.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const info = seller ? statusInfo[seller.status] : null
  const selectedIdType = ID_TYPES.find((t) => t.value === form.idProofType)

  return (
    <div className="bg-[#F0F0F8] min-h-[60vh] py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#101A30]">Become a Seller</h1>
        <p className="text-sm text-[#52647D] mt-1">
          Start selling your products on Qcart.
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

            <SellerDetails seller={seller} />

            <Link
              to="/"
              className="inline-block mt-6 text-sm font-semibold text-[#2864F0] hover:text-[#2878C8]"
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {submitError}
              </div>
            )}

            {/* Shop details */}
            <Field label="Shop Name" error={fieldErrors.shopName}>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) => setField('shopName', e.target.value)}
                maxLength={100}
                placeholder="Enter your shop name"
                className={inputClass(fieldErrors.shopName)}
              />
            </Field>

            <Field label="Description" optional error={fieldErrors.description}>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Tell customers about your shop"
                className={inputClass(fieldErrors.description)}
              />
            </Field>

            <Field
              label="GST Number"
              optional
              error={fieldErrors.gstNumber}
              hint="15 characters, for example 22AAAAA0000A1Z5"
            >
              <input
                type="text"
                value={form.gstNumber}
                onChange={(e) => setField('gstNumber', e.target.value.toUpperCase())}
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
                className={inputClass(fieldErrors.gstNumber)}
              />
            </Field>

            {/* ID proof */}
            <div className="pt-2 border-t border-gray-100">
              <h2 className="text-base font-bold text-[#101A30] mt-4">Identity proof</h2>
              <p className="text-xs text-[#52647D] mt-1">
                Used only to verify your seller application.
              </p>
            </div>

            <Field label="ID Proof Type" error={fieldErrors.idProofType}>
              <select
                value={form.idProofType}
                onChange={(e) => handleIdTypeChange(e.target.value)}
                className={`${inputClass(fieldErrors.idProofType)} bg-white`}
              >
                <option value="">Select ID proof type</option>
                {ID_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="ID Proof Number"
              error={fieldErrors.idProofNumber}
              hint={selectedIdType?.hint}
            >
              <input
                type="text"
                value={form.idProofNumber}
                onChange={(e) => setField('idProofNumber', e.target.value.toUpperCase())}
                maxLength={20}
                autoComplete="off"
                disabled={!selectedIdType}
                placeholder={
                  selectedIdType ? selectedIdType.placeholder : 'Select an ID type first'
                }
                className={`${inputClass(fieldErrors.idProofNumber)} disabled:bg-gray-50`}
              />
            </Field>

            {/* Address */}
            <div className="pt-2 border-t border-gray-100">
              <h2 className="text-base font-bold text-[#101A30] mt-4">Business address</h2>
            </div>

            <Field label="Address Line 1" error={fieldErrors.addressLine1}>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => setField('addressLine1', e.target.value)}
                maxLength={200}
                placeholder="House / building, street"
                className={inputClass(fieldErrors.addressLine1)}
              />
            </Field>

            <Field label="Address Line 2" optional error={fieldErrors.addressLine2}>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setField('addressLine2', e.target.value)}
                maxLength={200}
                placeholder="Area, landmark"
                className={inputClass(fieldErrors.addressLine2)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="City" error={fieldErrors.city}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  maxLength={100}
                  placeholder="City"
                  className={inputClass(fieldErrors.city)}
                />
              </Field>

              <Field label="State" error={fieldErrors.state}>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  maxLength={100}
                  placeholder="State"
                  className={inputClass(fieldErrors.state)}
                />
              </Field>
            </div>

            <Field label="PIN Code" error={fieldErrors.postalCode}>
              <input
                type="text"
                inputMode="numeric"
                value={form.postalCode}
                onChange={(e) => setField('postalCode', e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="676101"
                className={inputClass(fieldErrors.postalCode)}
              />
            </Field>

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