/**
 * Seller Products List
 *
 * GET  /products/mine  → { success, data: Product[] }
 * DELETE /products/:id → soft-archive (status → ARCHIVED)
 */
import sellerService from '../../api/service/sellerService'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Plus, Edit2, Archive, Eye } from 'lucide-react'

const STATUS_COLOR = {
  ACTIVE:   'bg-green-100  text-green-700',
  DRAFT:    'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100    text-red-700',
  ARCHIVED: 'bg-gray-100   text-gray-500',
}

function SellerProducts() {
  const navigate = useNavigate()
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [archiving, setArchiving] = useState(null)
  const [filter,    setFilter]    = useState('ALL')

  useEffect(() => {
    sellerService.listMyProducts()
      .then(res => setProducts(res?.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this product? It will no longer be visible to customers.')) return
    setArchiving(id)
    try {
      await sellerService.archiveProduct(id)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'ARCHIVED' } : p))
    } catch (err) {
      alert(err.message)
    } finally {
      setArchiving(null)
    }
  }

  const statusCounts = ['ALL','ACTIVE','DRAFT','REJECTED','ARCHIVED'].reduce((acc, s) => {
    acc[s] = s === 'ALL' ? products.length : products.filter(p => p.status === s).length
    return acc
  }, {})

  const filtered = filter === 'ALL' ? products : products.filter(p => p.status === filter)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-7 h-7 border-4 border-[#2864F0] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">{error}</div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#101A30]">My Products</h2>
        <button
          onClick={() => navigate('/seller/products/new')}
          className="flex items-center gap-2 bg-[#2864F0] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2878C8]"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(statusCounts).map(([s, count]) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === s
                ? 'bg-[#2864F0] text-white'
                : 'bg-white border border-gray-200 text-[#52647D] hover:border-[#2864F0] hover:text-[#2864F0]'
            }`}
          >
            {s} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[#52647D]">No products found.</p>
            <button
              onClick={() => navigate('/seller/products/new')}
              className="mt-4 inline-flex items-center gap-2 text-sm text-[#2864F0] font-semibold hover:underline"
            >
              <Plus size={14} /> Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Product','Status','Slug','Category','Added','Actions'].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-[#52647D] uppercase tracking-wide ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const minPrice = p.variants?.length
                    ? Math.min(...p.variants.map(v => Number(v.price)))
                    : null
                  return (
                    <tr key={p.id} className="hover:bg-[#F0F0F8] transition-colors">

                      {/* Product name + brand + image */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            <img src={p.images[0].url} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[#101A30] truncate max-w-[160px]">{p.name}</p>
                            {p.brand && <p className="text-xs text-[#52647D]">{p.brand}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3 text-xs text-[#52647D] font-mono max-w-[100px] truncate">
                        {p.slug || '—'}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3 text-xs text-[#52647D]">
                        {p.categoryId || '—'}
                      </td>

                      {/* Variants count */}

                      {/* Price */}

                      {/* Added date */}
                      <td className="px-5 py-3 text-xs text-[#52647D] whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === 'ACTIVE' && (
                            <Link to={`/product/${p.id}`} target="_blank"
                              className="p-1.5 text-gray-400 hover:text-[#2864F0] rounded-lg hover:bg-blue-50" title="View on store">
                              <Eye size={16} />
                            </Link>
                          )}
                          <Link to={`/seller/products/${p.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-[#2864F0] rounded-lg hover:bg-blue-50" title="Edit">
                            <Edit2 size={16} />
                          </Link>
                          {p.status !== 'ARCHIVED' && (
                            <button onClick={() => handleArchive(p.id)} disabled={archiving === p.id}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50" title="Archive">
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerProducts
