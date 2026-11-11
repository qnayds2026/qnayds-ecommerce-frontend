// File: src/pages/Categories.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api'

// Emoji icons for known categories (matched by name)
const categoryIcons = {
  fashion: '👗',
  beauty: '💄',
  electronics: '💻',
  footwear: '👟',
  'home & kitchen': '🏠',
  accessories: '👜',
}

function getCategoryIcon(name) {
  return categoryIcons[(name || '').trim().toLowerCase()] || null
}

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        setLoading(true)
        setError('')
        const res = await apiRequest('/categories')
        if (!cancelled) setCategories(res.data || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-white min-h-[60vh]">
      {/* Page header */}
      <section className="bg-[#F0F0F8]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-[#101A30]">All Categories</h1>
          <p className="text-[#52647D] mt-2">
            Pick a category to explore its products
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            Could not load categories: {error}
          </div>
        )}

        {loading ? (
          <p className="text-[#52647D]">Loading categories...</p>
        ) : categories.length === 0 ? (
          <div className="bg-[#F0F0F8] rounded-xl p-10 text-center">
            <p className="text-[#52647D]">No categories available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => {
              const icon = getCategoryIcon(category.name)

              return (
                <Link
                  key={category.id}
                  to={`/products?categoryId=${category.id}`}
                  className="group bg-[#F0F0F8] rounded-xl py-8 px-4 text-center border border-transparent hover:border-[#2864F0] hover:shadow-md transition-all"
                >
                  <div className="h-16 flex items-center justify-center">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        loading="lazy"
                        className="h-16 w-16 object-cover rounded-full group-hover:scale-110 transition-transform"
                      />
                    ) : icon ? (
                      <span className="text-6xl group-hover:scale-110 transition-transform">
                        {icon}
                      </span>
                    ) : (
                      <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-[#2864F0]">
                        {category.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-[#101A30] mt-4 group-hover:text-[#2864F0]">
                    {category.name}
                  </h3>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Categories