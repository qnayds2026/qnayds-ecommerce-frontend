/**
 * Seller Profile (read-only)
 *
 * API shapes:
 *   GET  /sellers/me → { success, data: { id, userId, shopName, description, status, createdAt, updatedAt } }
 *   POST /sellers    → { success, data: profile }  (create new profile if none exists)
 *
 * NOTE: There is no PATCH /sellers/:id endpoint — the seller profile can only be created.
 *       Status changes are admin-only. Shop info is therefore displayed read-only.
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { Store, Clock, CheckCircle, AlertCircle, XCircle, Plus } from 'lucide-react'

const STATUS_META = {
  PENDING:   { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', Icon: Clock },
  APPROVED:  { label: 'Approved',       color: 'bg-green-100  text-green-700  border-green-200',  Icon: CheckCircle },
  REJECTED:  { label: 'Rejected',       color: 'bg-red-100    text-red-700    border-red-200',    Icon: XCircle },
  SUSPENDED: { label: 'Suspended',      color: 'bg-gray-100   text-gray-700   border-gray-200',   Icon: AlertCircle },
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#52647D] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[#101A30] text-sm leading-relaxed">{value || <span className="italic text-gray-400">—</span>}</p>
    </div>
  )
}

function SellerProfile() {
  const [profile,       setProfile]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')

  /* create form */
  const [showCreate,    setShowCreate]    = useState(false)
  const [createForm,    setCreateForm]    = useState({ shopName: '', description: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError,   setCreateError]   = useState('')

  useEffect(() => { fetchProfile() }, [])

  function fetchProfile() {
    setLoading(true)
    setError('')
    sellerService.getMyProfile()
      .then(res => setProfile(res?.data || null))
      .catch(err => {
        if (err.status === 404) setProfile(null)
        else setError(err.message)
      })
      .finally(() => setLoading(false))
  }

  const handleCreate = async e => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    try {
      await sellerService.createProfile({
        shopName:    createForm.shopName,
        description: createForm.description || undefined,
      })
      setShowCreate(false)
      fetchProfile()
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  /* ── loading / error states ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-[#52647D]">Loading profile…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">{error}</div>
  )

  /* ── no profile yet ── */
  if (!profile) return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Store size={24} className="text-[#2864F0]" />
          <h2 className="text-lg font-bold text-[#101A30]">Set Up Your Shop</h2>
        </div>
        <p className="text-sm text-[#52647D] mb-6">
          You haven't created a seller profile yet. Fill in the details below to apply.
        </p>

        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#2864F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2878C8]"
          >
            <Plus size={15} /> Create Seller Profile
          </button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{createError}</div>
            )}
            <div>
              <label className="block text-sm font-semibold text-[#101A30] mb-1.5">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.shopName}
                onChange={e => setCreateForm(f => ({ ...f, shopName: e.target.value }))}
                required minLength={2} maxLength={100}
                placeholder="Enter your shop name"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#101A30] mb-1.5">Description</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                rows={4} maxLength={1000}
                placeholder="Tell customers about your shop…"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10 resize-none"
              />
              <p className="text-xs text-right text-[#52647D] mt-1">{createForm.description.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createLoading}
                className="bg-[#2864F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2878C8] disabled:opacity-60">
                {createLoading ? 'Creating…' : 'Create Profile'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="border border-gray-200 text-[#101A30] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  /* ── profile exists ── */
  const meta       = STATUS_META[profile.status] || STATUS_META.PENDING
  const { Icon }   = meta

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="text-xl font-bold text-[#101A30]">Shop Profile</h2>

      {/* Status banner */}
      <div className={`flex items-start gap-3 rounded-2xl p-4 border ${meta.color}`}>
        <Icon size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{meta.label}</p>
          <p className="text-xs mt-0.5 opacity-80">
            {profile.status === 'PENDING'   && "Your application is under review. We'll notify you once it's processed."}
            {profile.status === 'APPROVED'  && 'Your shop is live. Active products are visible to customers.'}
            {profile.status === 'REJECTED'  && 'Your application was not approved. Please contact support for details.'}
            {profile.status === 'SUSPENDED' && 'Your shop has been suspended. Please contact support.'}
          </p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        {/* Header */}
        <div className="flex items-center gap-4 pb-5 mb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-[#2864F0]/10 flex items-center justify-center shrink-0">
            <Store size={26} className="text-[#2864F0]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#101A30]">{profile.shopName}</h3>
            <p className="text-xs text-[#52647D] mt-0.5">
              Seller since {new Date(profile.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}
            </p>
          </div>
          <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${meta.color}`}>
            <Icon size={12} /> {meta.label}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow label="Shop Name"   value={profile.shopName} />
          <InfoRow label="Status"      value={meta.label} />
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-[#52647D] uppercase tracking-wide mb-1">Description</p>
            {profile.description
              ? <p className="text-sm text-[#101A30] leading-relaxed">{profile.description}</p>
              : <p className="text-sm italic text-gray-400">No description added.</p>
            }
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-[#52647D]">
          <div>
            <p className="font-semibold mb-0.5">Profile ID</p>
            <p className="font-mono text-[10px] break-all">{profile.id}</p>
          </div>
          <div>
            <p className="font-semibold mb-0.5">Created</p>
            <p>{new Date(profile.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="font-semibold mb-0.5">Last Updated</p>
            <p>{new Date(profile.updatedAt).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          <strong>Note:</strong> To update your shop name or description, please contact support. Status changes are managed by our admin team.
        </div>
      </div>
    </div>
  )
}

export default SellerProfile
