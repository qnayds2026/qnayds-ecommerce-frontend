/**
 * Add / Edit Product
 *
 * POST   /products                      → create product
 * PATCH  /products/:id                  → update product
 * POST   /products/:id/variants         → add variant
 * PATCH  /variants/:id                  → update variant (name, price, isActive)
 * PATCH  /variants/:id/inventory        → update stock
 * POST   /products/:id/images           → add image
 * DELETE /images/:id                    → remove image
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Plus, Trash2, Edit2, Check, X,
  Package, ChevronDown, ChevronUp,
} from 'lucide-react'

/* ─── helpers ─── */
function parseAttrs(str) {
  if (!str || !str.trim()) return {}
  try { return JSON.parse(str) } catch { return null }   // null = parse error
}

function AttrsChips({ attrs }) {
  const entries = Object.entries(attrs || {})
  if (!entries.length) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]) => (
        <span key={k} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
          {k}: {v}
        </span>
      ))}
    </div>
  )
}

/* ─── inline variant editor row ─── */
function VariantRow({ variant, productId, onUpdated, onDeleted }) {
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({
    name:  variant.name  || '',
    price: String(variant.price),
    compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : '',
    isActive: variant.isActive,
  })
  const [stockDelta, setStockDelta] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleSave = async () => {
    setSaving(true); setErr('')
    try {
      const payload = {}
      if (form.name !== (variant.name || ''))    payload.name           = form.name || undefined
      if (form.price !== String(variant.price))  payload.price          = form.price
      if (form.compareAtPrice !== (variant.compareAtPrice ? String(variant.compareAtPrice) : ''))
        payload.compareAtPrice = form.compareAtPrice || null
      if (form.isActive !== variant.isActive)    payload.isActive       = form.isActive

      if (Object.keys(payload).length) {
        const res = await sellerService.updateVariant(variant.id, payload)
        onUpdated(res?.data)
      }

      // stock delta
      if (stockDelta !== '' && Number(stockDelta) !== 0) {
        const sRes = await sellerService.updateInventory(variant.id, { delta: Number(stockDelta) })
        onUpdated({ ...variant, inventory: sRes?.data })
      }

      setEditing(false)
      setStockDelta('')
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const avail = variant.inventory?.quantityAvailable ?? '—'

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Row summary */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[#101A30] text-sm">
              {variant.name || <span className="italic text-gray-400 font-normal">No name</span>}
            </span>
            <span className="text-xs text-[#52647D] font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              {variant.sku}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${variant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {variant.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[#52647D]">
            <span>₹{Number(variant.price).toLocaleString('en-IN')}</span>
            {variant.compareAtPrice && (
              <span className="line-through text-gray-400">₹{Number(variant.compareAtPrice).toLocaleString('en-IN')}</span>
            )}
            <span>Stock: <strong className={typeof avail === 'number' && avail <= 5 ? 'text-red-600' : 'text-[#101A30]'}>{avail}</strong></span>
          </div>
          <AttrsChips attrs={variant.attributes} />
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <button type="button" onClick={() => { setEditing(e => !e); setExpanded(false); setErr('') }}
            className="p-1.5 text-gray-400 hover:text-[#2864F0] rounded-lg hover:bg-blue-50" title="Edit variant">
            <Edit2 size={14} />
          </button>
          <button type="button" onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-gray-400 hover:text-[#2864F0] rounded-lg hover:bg-blue-50">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-3 bg-white">
          {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#101A30] mb-1">Variant Name</label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Red / Large"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#101A30] mb-1">Price (₹) *</label>
              <input type="number" value={form.price} min="0" step="0.01"
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#101A30] mb-1">Compare-At (₹)</label>
              <input type="number" value={form.compareAtPrice} min="0" step="0.01"
                onChange={e => setForm(f => ({ ...f, compareAtPrice: e.target.value }))}
                placeholder="optional"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#101A30] mb-1">Adjust Stock (+/-)</label>
              <input type="number" value={stockDelta}
                onChange={e => setStockDelta(e.target.value)}
                placeholder="e.g. +10 or -5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#101A30] cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="rounded" />
              Active
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-[#2864F0] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#2878C8] disabled:opacity-60">
              <Check size={13} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => { setEditing(false); setErr('') }}
              className="flex items-center gap-1.5 border border-gray-200 text-[#101A30] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50">
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && !editing && (
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-[#52647D] space-y-1 bg-white">
          <p><strong>SKU:</strong> {variant.sku}</p>
          <p><strong>Inventory ID:</strong> {variant.inventory?.id || '—'}</p>
          <p><strong>Reserved:</strong> {variant.inventory?.quantityReserved ?? '—'}</p>
          {Object.keys(variant.attributes || {}).length > 0 && (
            <p><strong>Attributes:</strong> {JSON.stringify(variant.attributes)}</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── add variant form ─── */
function AddVariantForm({ productId, onAdded, onCancel }) {
  const [form, setForm] = useState({
    sku: '', name: '', price: '', compareAtPrice: '',
    initialStock: '0', attributes: '',
  })
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sku || !form.price) { setErr('SKU and Price are required.'); return }
    const attrs = parseAttrs(form.attributes)
    if (attrs === null) { setErr('Attributes is not valid JSON. e.g. {"color":"red","size":"M"}'); return }

    setLoading(true); setErr('')
    try {
      const payload = {
        sku: form.sku,
        price: form.price,
        initialStock: Number(form.initialStock) || 0,
        attributes: attrs,
      }
      if (form.name)           payload.name           = form.name
      if (form.compareAtPrice) payload.compareAtPrice = form.compareAtPrice

      const res = await sellerService.addVariant(productId, payload)
      onAdded(res?.data)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-dashed border-[#2864F0]/30 rounded-xl p-4 space-y-3 bg-blue-50/20">
      {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#101A30] mb-1">SKU <span className="text-red-500">*</span></label>
          <input type="text" value={form.sku} onChange={f('sku')}
            minLength={2} maxLength={64} placeholder="e.g. SHOE-RED-42"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#101A30] mb-1">Variant Name</label>
          <input type="text" value={form.name} onChange={f('name')}
            placeholder="e.g. Red / Size 42"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#101A30] mb-1">Price (₹) <span className="text-red-500">*</span></label>
          <input type="number" value={form.price} onChange={f('price')}
            min="0.01" step="0.01" placeholder="0.00"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#101A30] mb-1">Compare-At (₹)</label>
          <input type="number" value={form.compareAtPrice} onChange={f('compareAtPrice')}
            min="0" step="0.01" placeholder="optional (MRP)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#101A30] mb-1">Initial Stock</label>
          <input type="number" value={form.initialStock} onChange={f('initialStock')}
            min="0"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2864F0]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#101A30] mb-1">
            Attributes <span className="text-[#52647D] font-normal">JSON</span>
          </label>
          <input type="text" value={form.attributes} onChange={f('attributes')}
            placeholder='{"color":"red","size":"42"}'
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-[#2864F0]" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 bg-[#2864F0] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#2878C8] disabled:opacity-60">
          <Plus size={13} /> {loading ? 'Adding…' : 'Add Variant'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="border border-gray-200 text-[#101A30] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

/* ─── main component ─── */
function SellerAddProduct() {
  const navigate  = useNavigate()
  const { id }    = useParams()
  const [createdId, setCreatedId] = useState(null)
  const productId = id || createdId
  const isEdit    = Boolean(productId)

  const [categories,   setCategories]   = useState([])
  const [fetchLoading, setFetchLoading] = useState(!!id)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')

  /* product fields */
  const [categoryId,  setCategoryId]  = useState('')
  const [name,        setName]        = useState('')
  const [brand,       setBrand]       = useState('')
  const [slug,        setSlug]        = useState('')
  const [description, setDescription] = useState('')

  /* lists */
  const [variants,     setVariants]    = useState([])
  const [images,       setImages]      = useState([])
  const [showAddVar,   setShowAddVar]  = useState(false)

  /* image form */
  const [imageUrl,  setImageUrl]  = useState('')
  const [imageAlt,  setImageAlt]  = useState('')
  const [imgLoading,setImgLoading]= useState(false)
  const [imgError,  setImgError]  = useState('')

  /* load categories */
  useEffect(() => {
    sellerService.getCategories()
      .then(res => setCategories(res?.data || []))
      .catch(() => {})
  }, [])

  /* load existing product */
  useEffect(() => {
    if (!id) return
    setFetchLoading(true)
    const load = (p) => {
      setCategoryId(p.categoryId || '')
      setName(p.name || '')
      setBrand(p.brand || '')
      setSlug(p.slug || '')
      setDescription(p.description || '')
      setVariants(p.variants || [])
      setImages(p.images || [])
    }
    // Public endpoint only returns ACTIVE; DRAFT falls back to /mine
    sellerService.listMyProducts()
      .then(res => {
        const p = (res?.data || []).find(x => x.id === id)
        if (p) load(p)
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false))
  }, [id])

  /* save product details */
  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      const payload = { categoryId, name }
      if (brand)       payload.brand       = brand
      if (slug)        payload.slug        = slug
      if (description) payload.description = description

      if (isEdit) {
        await sellerService.updateProduct(productId, payload)
        setSuccess('Product updated successfully.')
      } else {
        const res = await sellerService.createProduct(payload)
        setCreatedId(res?.data?.id)
        setSuccess('Product created! Now add variants and an image below.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* add image */
  const handleAddImage = async (e) => {
    e.preventDefault()
    if (!imageUrl) return
    setImgLoading(true); setImgError('')
    try {
      const res = await sellerService.addImage(productId, {
        url: imageUrl,
        altText: imageAlt || undefined,
        sortOrder: images.length,
      })
      setImages(imgs => [...imgs, res?.data])
      setImageUrl(''); setImageAlt('')
    } catch (err) {
      setImgError(err.message)
    } finally {
      setImgLoading(false)
    }
  }

  /* delete image */
  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Remove this image?')) return
    try {
      await sellerService.deleteImage(imgId)
      setImages(imgs => imgs.filter(i => i.id !== imgId))
    } catch (err) { alert(err.message) }
  }

  if (fetchLoading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/seller/products')}
          className="text-[#52647D] hover:text-[#2864F0] p-1 rounded-lg hover:bg-blue-50">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-[#101A30]">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
      </div>

      {/* ── 1. PRODUCT DETAILS ── */}
      <form onSubmit={handleSaveProduct} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#101A30] uppercase tracking-wide pb-2 border-b border-gray-100">
          Product Details
        </h3>

        {error   && <div className="bg-red-50   border border-red-200   text-red-600   rounded-xl p-3 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">{success}</div>}

        <div>
          <label className="block text-sm font-semibold text-[#101A30] mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10">
            <option value="">Select a category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#101A30] mb-1.5">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            required minLength={2} maxLength={200} placeholder="Enter product name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#101A30] mb-1.5">Brand</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
              maxLength={100} placeholder="e.g. Nike"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#101A30] mb-1.5">
              URL Slug <span className="text-xs text-[#52647D] font-normal">(auto if empty)</span>
            </label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
              placeholder="blue-denim-jacket"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#101A30] mb-1.5">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={4} maxLength={5000} placeholder="Describe your product…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10 resize-none" />
          <p className="text-xs text-right text-[#52647D] mt-1">{description.length}/5000</p>
        </div>

        <button type="submit" disabled={loading}
          className="flex items-center gap-2 bg-[#2864F0] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2878C8] disabled:opacity-60">
          <Save size={15} />
          {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </form>

      {/* ── 2. VARIANTS (only after product exists) ── */}
      {isEdit && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-[#101A30] uppercase tracking-wide">
              Variants
              {variants.length > 0 && (
                <span className="ml-2 text-xs bg-[#2864F0]/10 text-[#2864F0] font-semibold px-2 py-0.5 rounded-full normal-case">
                  {variants.length}
                </span>
              )}
            </h3>
            {!showAddVar && (
              <button type="button" onClick={() => setShowAddVar(true)}
                className="flex items-center gap-1.5 text-xs text-[#2864F0] font-semibold hover:underline">
                <Plus size={13} /> Add Variant
              </button>
            )}
          </div>

          {/* Existing variants */}
          {variants.length === 0 && !showAddVar && (
            <div className="text-center py-6">
              <Package size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-[#52647D]">No variants yet.</p>
              <button type="button" onClick={() => setShowAddVar(true)}
                className="mt-2 text-sm text-[#2864F0] font-semibold hover:underline">
                + Add your first variant
              </button>
            </div>
          )}

          <div className="space-y-3">
            {variants.map(v => (
              <VariantRow
                key={v.id}
                variant={v}
                productId={productId}
                onUpdated={(updated) => setVariants(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))}
                onDeleted={(vid) => setVariants(prev => prev.filter(x => x.id !== vid))}
              />
            ))}
          </div>

          {/* Add variant form */}
          {showAddVar && (
            <AddVariantForm
              productId={productId}
              onAdded={(v) => { setVariants(prev => [...prev, v]); setShowAddVar(false) }}
              onCancel={() => setShowAddVar(false)}
            />
          )}
        </div>
      )}

      {/* ── 3. IMAGES (only after product exists) ── */}
      {isEdit && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#101A30] uppercase tracking-wide pb-2 border-b border-gray-100">
            Images
            {images.length > 0 && (
              <span className="ml-2 text-xs bg-[#2864F0]/10 text-[#2864F0] font-semibold px-2 py-0.5 rounded-full normal-case">
                {images.length}
              </span>
            )}
          </h3>

          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                  <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => handleDeleteImage(img.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-[#2864F0] text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add image form */}
          <form onSubmit={handleAddImage} className="space-y-3">
            {imgError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{imgError}</p>}
            <div>
              <label className="block text-sm font-semibold text-[#101A30] mb-1.5">
                Image URL <span className="text-xs text-[#52647D] font-normal">(HTTPS required)</span>
              </label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/product.jpg"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#101A30] mb-1.5">Alt Text</label>
              <input type="text" value={imageAlt} onChange={e => setImageAlt(e.target.value)}
                maxLength={200} placeholder="Describe the image for accessibility"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10" />
            </div>
            <button type="submit" disabled={imgLoading || !imageUrl}
              className="flex items-center gap-2 border-2 border-dashed border-[#2864F0]/40 text-[#2864F0] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 disabled:opacity-50">
              <Plus size={15} /> {imgLoading ? 'Adding…' : 'Add Image'}
            </button>
          </form>
        </div>
      )}

      {/* hint before product is created */}
      {!isEdit && (
        <p className="text-xs text-[#52647D] italic text-center">
          Save the product first — variants and images will appear below.
        </p>
      )}
    </div>
  )
}

export default SellerAddProduct
