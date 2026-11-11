// File: src/pages/AdminCategories.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

const emptyForm = { name: '', slug: '', description: '', imageUrl: '', parentId: '' }

// Make a URL-friendly slug from a name
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [processingId, setProcessingId] = useState('')

  // Form state (editingId = '' means "add new")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadCategories() {
    try {
      setLoading(true)
      setError('')
      const res = await apiRequest('/categories/admin/all')
      setCategories(res.data || [])
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const parentName = (id) => categories.find((c) => c.id === id)?.name || '-'

  const openAdd = () => {
    setEditingId('')
    setForm(emptyForm)
    setSlugTouched(false)
    setFormError('')
    setMessage('')
    setShowForm(true)
  }

  const openEdit = (cat) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentId || '',
    })
    setSlugTouched(true)
    setFormError('')
    setMessage('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId('')
    setFormError('')
  }

  const handleNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      setSaving(true)

      if (editingId) {
        // Edit: send all editable fields (empty text becomes null)
        const body = {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          parentId: form.parentId || null,
        }
        await apiRequest(`/categories/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        setMessage(`"${body.name}" updated.`)
      } else {
        // Create: send optional fields only when filled
        const body = { name: form.name.trim(), slug: form.slug.trim() }
        if (form.description.trim()) body.description = form.description.trim()
        if (form.imageUrl.trim()) body.imageUrl = form.imageUrl.trim()
        if (form.parentId) body.parentId = form.parentId
        await apiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        setMessage(`"${body.name}" created.`)
      }

      closeForm()
      await loadCategories()
    } catch (err) {
      setFormError(err.message || 'Could not save category.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (cat) => {
    const next = !cat.isActive
    const ok = window.confirm(
      `${next ? 'Activate' : 'Deactivate'} "${cat.name}"?`
    )
    if (!ok) return

    try {
      setProcessingId(cat.id)
      setError('')
      setMessage('')
      await apiRequest(`/categories/${cat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      })
      setMessage(`"${cat.name}" is now ${next ? 'active' : 'inactive'}.`)
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: next } : c))
      )
    } catch (err) {
      setError(err.message || 'Could not update category.')
    } finally {
      setProcessingId('')
    }
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#101A30] focus:outline-none focus:border-[#2864F0]'

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#101A30]">Categories</h2>
          <p className="text-sm text-[#52647D] mt-1">
            Add and manage product categories. ({categories.length} total)
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition"
          >
            + Add Category
          </button>
        )}
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 bg-white rounded-xl shadow-sm p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-[#101A30]">
            {editingId ? 'Edit Category' : 'Add Category'}
          </h3>

          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-[#52647D] mb-1">Name *</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-[#52647D] mb-1">
                Slug * (small letters, numbers, hyphen)
              </label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-[#52647D] mb-1">
                Parent category
              </label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                className={inputClass}
              >
                <option value="">None (top level)</option>
                {categories
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#52647D] mb-1">Image URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#52647D] mb-1">Description</label>
            <textarea
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create category'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-[#101A30] hover:bg-[#E4E4F2] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories table */}
      <div className="mt-5 bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-6 text-[#52647D]">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="p-6 text-[#52647D]">No categories found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#52647D] border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium">Parent</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const isProcessing = processingId === cat.id
                return (
                  <tr key={cat.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#101A30]">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-[#52647D] mt-1 max-w-xs truncate">
                          {cat.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#52647D]">{cat.slug}</td>
                    <td className="px-6 py-4 text-[#52647D]">
                      {cat.parentId ? parentName(cat.parentId) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
                          cat.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-[#101A30] hover:bg-[#E4E4F2] transition"
                        >
                          Edit
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleToggleActive(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                            cat.isActive
                              ? 'border border-red-300 text-red-600 hover:bg-red-50'
                              : 'bg-[#2864F0] text-white hover:bg-[#2878C8]'
                          }`}
                        >
                          {isProcessing
                            ? 'Please wait...'
                            : cat.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminCategories