import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { apiRequest } from '../services/api'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function StarRow({ rating, size = 15 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          className={
            n <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300 fill-gray-100'
          }
        />
      ))}
    </div>
  )
}

function MyReviews() {
  const navigate = useNavigate()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editRating, setEditRating] = useState(0)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editHovered, setEditHovered] = useState(0)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#2864F0]'

  const loadReviews = (p = 1) => {
    setLoading(true)
    setError('')
    apiRequest(`/reviews/me?page=${p}&limit=10`)
      .then((res) => {
        setReviews(res?.data?.reviews || [])
        setTotalPages(res?.data?.pagination?.totalPages || 1)
      })
      .catch((err) => setError(err.message || 'Could not load reviews'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login')
      return
    }
    loadReviews(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changePage = (p) => {
    setPage(p)
    loadReviews(p)
  }

  const startEdit = (review) => {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditTitle(review.title || '')
    setEditBody(review.body || '')
    setEditHovered(0)
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

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' })
      loadReviews(page)
    } catch (err) {
      alert(err.message || 'Could not delete review')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F0F0F8]">
        <p className="text-[#52647D]">Loading your reviews...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#F0F0F8] min-h-screen py-6 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <p className="text-xs text-[#52647D] mb-4">
          <Link to="/" className="hover:text-[#2864F0]">Home</Link>
          {' > '}
          <Link to="/customer" className="hover:text-[#2864F0]">My Account</Link>
          {' > '}
          <span>My Reviews</span>
        </p>

        <div className="bg-white rounded-2xl p-6 md:p-8">
          <h1 className="text-xl font-bold text-[#101A30] mb-6">My Reviews</h1>

          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {!error && reviews.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">⭐</div>
              <p className="text-[#101A30] font-semibold text-lg">No reviews yet</p>
              <p className="text-sm text-[#52647D] mt-1">
                After receiving a delivered order, go to the product page to leave a review.
              </p>
              <Link
                to="/"
                className="inline-block mt-5 bg-[#2864F0] text-white px-6 py-3 rounded-lg text-sm font-medium"
              >
                Browse Products
              </Link>
            </div>
          )}

          <div className="space-y-5">
            {reviews.map((review) => {
              const isEditing = editingId === review.id
              const productName = review.product?.name || 'Product'
              const productId   = review.product?.id

              return (
                <div
                  key={review.id}
                  className="border border-gray-100 rounded-xl p-4 md:p-5"
                >
                  {/* Product name + link */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Link
                      to={`/product/${productId}`}
                      className="font-semibold text-[#101A30] hover:text-[#2864F0] text-sm leading-snug"
                    >
                      {productName}
                    </Link>
                    <p className="text-xs text-[#52647D] shrink-0">{formatDate(review.createdAt)}</p>
                  </div>

                  {isEditing ? (
                    /* ── Inline edit form ── */
                    <div className="space-y-3">
                      {/* Star picker */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={26}
                            strokeWidth={1.5}
                            className={`cursor-pointer transition-colors ${
                              n <= (editHovered || editRating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 fill-gray-100'
                            }`}
                            onMouseEnter={() => setEditHovered(n)}
                            onMouseLeave={() => setEditHovered(0)}
                            onClick={() => setEditRating(n)}
                          />
                        ))}
                      </div>

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
                          {editSaving ? 'Saving...' : 'Save Changes'}
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
                      <div className="flex items-center gap-2">
                        <StarRow rating={review.rating} />
                        {review.title && (
                          <p className="text-sm font-semibold text-[#101A30]">{review.title}</p>
                        )}
                      </div>
                      {review.body && (
                        <p className="text-sm text-[#52647D] mt-2 leading-relaxed">{review.body}</p>
                      )}

                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => startEdit(review)}
                          className="text-xs text-[#2864F0] border border-[#2864F0]/30 px-3 py-1.5 rounded-lg hover:bg-[#F0F0F8]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-[#52647D] disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-[#52647D]">{page} / {totalPages}</span>
              <button
                onClick={() => changePage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-[#52647D] disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyReviews
