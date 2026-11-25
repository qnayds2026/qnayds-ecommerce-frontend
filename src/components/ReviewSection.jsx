import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { apiRequest } from '../services/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Filled / half / empty star row
function StarRow({ rating, size = 18, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || rating) : rating

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          className={`${
            n <= display ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-100'
          } ${interactive ? 'cursor-pointer transition-colors' : ''}`}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(n)}
        />
      ))}
    </div>
  )
}

// Average rating bar (5 → 1)
function RatingBars({ breakdown, total }) {
  return (
    <div className="space-y-1.5 w-full">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[star] || 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={star} className="flex items-center gap-2 text-xs text-[#52647D]">
            <span className="w-3 text-right">{star}</span>
            <Star size={11} strokeWidth={1.5} className="text-yellow-400 fill-yellow-400 shrink-0" />
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function ReviewSection({ productId }) {
  const navigate = useNavigate()

  // List state
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({ averageRating: null, totalReviews: 0 })
  const [breakdown, setBreakdown] = useState({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  // Write-review form state
  const [showForm, setShowForm] = useState(false)
  const [deliveredOrders, setDeliveredOrders] = useState([])  // orders eligible to review
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editRating, setEditRating] = useState(0)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const isLoggedIn = Boolean(sessionStorage.getItem('accessToken'))
  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('user')) } catch { return null }
  })()

  // ── Load reviews ───────────────────────────────────────────────────────────

  const loadReviews = (p = page) => {
    setLoadingList(true)
    setListError('')
    apiRequest(`/products/${productId}/reviews?page=${p}&limit=5`)
      .then((res) => {
        const data = res?.data
        setReviews(data?.reviews || [])
        setSummary(data?.summary || { averageRating: null, totalReviews: 0 })
        setTotalPages(data?.pagination?.totalPages || 1)

        // Build rating breakdown from returned reviews (approximate from current page)
        const bd = {}
        ;(data?.reviews || []).forEach((r) => {
          bd[r.rating] = (bd[r.rating] || 0) + 1
        })
        setBreakdown(bd)
      })
      .catch((err) => setListError(err.message || 'Could not load reviews'))
      .finally(() => setLoadingList(false))
  }

  useEffect(() => {
    if (productId) loadReviews(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // ── Load delivered orders (to pick which order to review) ─────────────────

  const loadDeliveredOrders = () => {
    if (!isLoggedIn) return
    apiRequest('/orders')
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : res?.data?.orders || res?.data?.items || []

        // Show all delivered orders — the backend validates whether
        // the order actually contains this product when submitting.
        const eligible = list.filter((order) => order.status === 'DELIVERED')
        setDeliveredOrders(eligible)
        if (eligible.length === 1) setSelectedOrderId(eligible[0].id)
      })
      .catch(() => {})
  }

  const handleOpenForm = () => {
    if (!isLoggedIn) { navigate('/login'); return }
    if (currentUser?.role !== 'CUSTOMER') return
    loadDeliveredOrders()
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
    setRating(0)
    setTitle('')
    setBody('')
    setSelectedOrderId('')
  }

  // ── Submit new review ──────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedOrderId) { setFormError('Please select the order you are reviewing'); return }
    if (rating < 1) { setFormError('Please select a star rating'); return }
    setSubmitting(true)
    setFormError('')
    try {
      await apiRequest(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrderId,
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
        }),
      })
      setFormSuccess('Your review has been submitted!')
      setShowForm(false)
      setPage(1)
      loadReviews(1)
    } catch (err) {
      setFormError(err.message || 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit review ────────────────────────────────────────────────────────────

  const startEdit = (review) => {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditTitle(review.title || '')
    setEditBody(review.body || '')
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError('')
  }

  const saveEdit = async (reviewId) => {
    if (editRating < 1) { setEditError('Please select a star rating'); return }
    setEditSaving(true)
    setEditError('')
    try {
      await apiRequest(`/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          rating: editRating,
          title: editTitle.trim() || undefined,
          body: editBody.trim() || undefined,
        }),
      })
      setEditingId(null)
      loadReviews(page)
    } catch (err) {
      setEditError(err.message || 'Could not update review')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Delete review ──────────────────────────────────────────────────────────

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' })
      loadReviews(page)
    } catch (err) {
      alert(err.message || 'Could not delete review')
    }
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  const changePage = (p) => {
    setPage(p)
    loadReviews(p)
  }

  // ── Shared input style ─────────────────────────────────────────────────────

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#2864F0]'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-semibold text-[#101A30] text-lg">Customer Reviews</h2>
        {isLoggedIn && currentUser?.role === 'CUSTOMER' && !showForm && (
          <button
            onClick={handleOpenForm}
            className="text-sm font-medium text-[#2864F0] border border-[#2864F0]/30 px-4 py-2 rounded-lg hover:bg-[#F0F0F8]"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Summary */}
      {summary.totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-6 p-4 bg-[#F0F0F8] rounded-xl">
          <div className="text-center min-w-[90px]">
            <p className="text-4xl font-bold text-[#101A30]">
              {summary.averageRating ?? '—'}
            </p>
            <StarRow rating={Math.round(summary.averageRating || 0)} size={16} />
            <p className="text-xs text-[#52647D] mt-1">
              {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 w-full">
            <RatingBars breakdown={breakdown} total={reviews.length} />
          </div>
        </div>
      )}

      {/* Success banner */}
      {formSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {formSuccess}
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <div className="border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          <p className="font-semibold text-[#101A30]">Your Review</p>

          {/* Order picker */}
          {deliveredOrders.length === 0 ? (
            <p className="text-sm text-[#52647D]">
              You need at least one delivered order to leave a review.
            </p>
          ) : (
            <>
              {deliveredOrders.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-[#101A30] mb-1.5">
                    Select Order
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="">— choose an order —</option>
                    {deliveredOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} · {formatDate(o.createdAt)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-[#101A30] mb-1.5">
                  Rating <span className="text-red-500">*</span>
                </label>
                <StarRow rating={rating} size={28} interactive onRate={setRating} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#101A30] mb-1.5">
                  Title <span className="text-[#52647D] font-normal">(optional)</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  placeholder="Summarise your experience"
                  className={inputCls}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-[#101A30] mb-1.5">
                  Review <span className="text-[#52647D] font-normal">(optional)</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Tell other shoppers what you thought"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#2864F0] text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#52647D] border border-gray-200"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Review list */}
      {loadingList ? (
        <p className="text-sm text-[#52647D]">Loading reviews...</p>
      ) : listError ? (
        <p className="text-sm text-red-500">{listError}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[#52647D]">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const isOwn = currentUser?.id && review.user?.id === currentUser.id
            const isEditing = editingId === review.id

            return (
              <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0">
                {isEditing ? (
                  /* ── Inline edit form ── */
                  <div className="space-y-3">
                    <StarRow rating={editRating} size={24} interactive onRate={setEditRating} />
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={150}
                      placeholder="Title (optional)"
                      className={inputCls}
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Review (optional)"
                      className={`${inputCls} resize-none`}
                    />
                    {editError && <p className="text-sm text-red-600">{editError}</p>}
                    <div className="flex gap-3">
                      <button
                        onClick={() => saveEdit(review.id)}
                        disabled={editSaving}
                        className="bg-[#2864F0] text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                      >
                        {editSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-5 py-2 rounded-lg text-sm text-[#52647D] border border-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Review display ── */
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StarRow rating={review.rating} size={15} />
                          {review.title && (
                            <p className="font-semibold text-sm text-[#101A30]">{review.title}</p>
                          )}
                        </div>
                        <p className="text-xs text-[#52647D] mt-1">
                          {review.user?.name || 'Customer'} · {formatDate(review.createdAt)}
                        </p>
                      </div>
                      {isOwn && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => startEdit(review)}
                            className="text-xs text-[#2864F0] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {review.body && (
                      <p className="text-sm text-[#52647D] mt-2 leading-relaxed">{review.body}</p>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-[#52647D] disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-[#52647D]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => changePage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-[#52647D] disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReviewSection
