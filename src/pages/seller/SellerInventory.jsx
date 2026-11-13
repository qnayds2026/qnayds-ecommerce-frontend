/**
 * Seller Inventory Management
 *
 * GET  /products/mine
 *   → { success, data: Product[] }   (each product has variants[{ id, sku, price, inventory: { quantityAvailable, quantityReserved } }])
 *
 * PATCH /variants/:id/inventory
 *   body: { delta: number }         relative adjustment  (+10, -5)
 *      OR { available: number }     set absolute quantity
 *   → { success, data: { id, variantId, quantityAvailable, quantityReserved, updatedAt } }
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { Boxes, Search, Edit2, Save, X, AlertTriangle } from 'lucide-react'

function SellerInventory() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')

  /* inline editor: { variantId, mode: 'delta'|'available', value, loading, error } */
  const [editing,  setEditing]  = useState(null)

  useEffect(() => {
    sellerService.listMyProducts()
      .then(res => setProducts(res?.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  /* flatten all variants across all products */
  const allVariants = products.flatMap(p =>
    (p.variants || []).map(v => ({ ...v, productName: p.name, productId: p.id, productStatus: p.status }))
  )

  const filtered = search.trim()
    ? allVariants.filter(v =>
        v.productName.toLowerCase().includes(search.toLowerCase()) ||
        v.sku.toLowerCase().includes(search.toLowerCase()) ||
        (v.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : allVariants

  const lowStockCount = allVariants.filter(v => typeof v.inventory?.quantityAvailable === 'number' && v.inventory.quantityAvailable <= 5).length

  const startEdit = (variantId, mode = 'delta') => setEditing({ variantId, mode, value: '', loading: false, error: '' })
  const cancelEdit = () => setEditing(null)

  const handleSave = async () => {
    if (!editing || editing.value === '') return
    const num = Number(editing.value)
    if (isNaN(num)) { setEditing(e => ({ ...e, error: 'Please enter a valid number.' })); return }

    setEditing(e => ({ ...e, loading: true, error: '' }))
    try {
      const payload = editing.mode === 'delta' ? { delta: num } : { available: num }
      const res = await sellerService.updateInventory(editing.variantId, payload)
      const updatedInv = res?.data
      /* update local state */
      setProducts(prev => prev.map(p => ({
        ...p,
        variants: (p.variants || []).map(v =>
          v.id === editing.variantId ? { ...v, inventory: updatedInv } : v
        ),
      })))
      setEditing(null)
    } catch (err) {
      setEditing(e => ({ ...e, loading: false, error: err.message }))
    }
  }

  /* ── loading / error ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">{error}</div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#101A30]">Inventory</h2>
          <p className="text-sm text-[#52647D] mt-0.5">{allVariants.length} variant(s) across {products.length} product(s)</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search product, SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#2864F0] w-56"
          />
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-orange-500 shrink-0" />
          <p className="text-sm text-orange-700">
            <strong>{lowStockCount}</strong> variant{lowStockCount > 1 ? 's are' : ' is'} low on stock (≤ 5 units). Update inventory now.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Boxes size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[#52647D]">
              {search ? 'No variants match your search.' : 'No variants yet. Add products with variants first.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Product / Variant', 'SKU', 'Available', 'Reserved', 'Price', 'Update Stock'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-[#52647D] uppercase tracking-wide ${i === 5 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(v => {
                  const avail    = v.inventory?.quantityAvailable ?? null
                  const reserved = v.inventory?.quantityReserved  ?? null
                  const isLow    = typeof avail === 'number' && avail <= 5
                  const isEditing = editing?.variantId === v.id

                  return (
                    <tr key={v.id} className="hover:bg-[#F0F0F8] transition-colors">

                      {/* Product / Variant */}
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#101A30]">{v.productName}</p>
                        <p className="text-xs text-[#52647D] mt-0.5">
                          {v.name || <em className="not-italic text-gray-400">Default variant</em>}
                        </p>
                        {Object.keys(v.attributes || {}).length > 0 && (
                          <p className="text-xs text-[#52647D]">
                            {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' · ')}
                          </p>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          v.productStatus === 'ACTIVE'   ? 'bg-green-100 text-green-700' :
                          v.productStatus === 'DRAFT'    ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {v.productStatus}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3 font-mono text-xs text-[#52647D]">{v.sku}</td>

                      {/* Available */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold ${isLow ? 'text-red-600' : 'text-[#101A30]'}`}>
                            {avail ?? '—'}
                          </span>
                          {isLow && avail !== null && (
                            <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reserved */}
                      <td className="px-5 py-3 text-[#52647D]">
                        {reserved ?? '—'}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3 font-medium text-[#101A30] whitespace-nowrap">
                        ₹{Number(v.price).toLocaleString('en-IN')}
                      </td>

                      {/* Update Stock */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5">
                              {/* mode toggle */}
                              <select
                                value={editing.mode}
                                onChange={e => setEditing(ed => ({ ...ed, mode: e.target.value, value: '' }))}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white outline-none focus:border-[#2864F0]"
                              >
                                <option value="delta">+/- Delta</option>
                                <option value="available">Set Qty</option>
                              </select>
                              <input
                                type="number"
                                value={editing.value}
                                onChange={e => setEditing(ed => ({ ...ed, value: e.target.value }))}
                                placeholder={editing.mode === 'delta' ? '±10' : '100'}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-20 outline-none focus:border-[#2864F0]"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit() }}
                              />
                              <button onClick={handleSave} disabled={editing.loading || editing.value === ''}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg disabled:opacity-40" title="Save">
                                <Save size={15} />
                              </button>
                              <button onClick={cancelEdit}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Cancel">
                                <X size={15} />
                              </button>
                            </div>
                            {editing.error && (
                              <p className="text-[10px] text-red-600 max-w-[200px] text-right">{editing.error}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => startEdit(v.id, 'delta')}
                              className="flex items-center gap-1.5 text-xs text-[#2864F0] hover:underline font-semibold px-2 py-1 rounded-lg hover:bg-blue-50"
                            >
                              <Edit2 size={13} /> Update
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-[#52647D] space-y-1">
        <p><strong className="text-[#2864F0]">+/- Delta:</strong> Adjusts stock by a relative amount (e.g. +10 adds 10, -5 removes 5). The backend rejects if it goes below 0.</p>
        <p><strong className="text-[#2864F0]">Set Qty:</strong> Sets the total available quantity directly. Must be ≥ current reserved quantity.</p>
      </div>
    </div>
  )
}

export default SellerInventory
