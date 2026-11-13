// File: src/pages/AdminReports.jsx
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api'

// Date range tabs (days: null means all time)
const ranges = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: 'All', days: null },
]

const badgeColors = {
  PENDING_PAYMENT: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-700 border-gray-200',
}

function formatStatus(status) {
  return (status || '').replace(/_/g, ' ')
}

function formatAmount(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return `₹${n.toLocaleString('en-IN')}`
}

// Local date key like 2026-11-10 (used to group orders by day)
function getDayKey(value) {
  const d = new Date(value)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function formatDayLabel(key) {
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// dailyOrders from the API is a list of single orders, so group them by day here.
// Order value excludes CANCELLED and REFUNDED (same rule as the backend summary).
function groupByDay(dailyOrders) {
  const map = {}
  for (const order of dailyOrders || []) {
    if (!order.createdAt) continue
    const key = getDayKey(order.createdAt)
    if (!map[key]) map[key] = { key, orders: 0, value: 0 }
    map[key].orders += 1
    if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
      map[key].value += Number(order.totalAmount) || 0
    }
  }
  // Newest day first
  return Object.values(map).sort((a, b) => (a.key < b.key ? 1 : -1))
}

function AdminReports() {
  const [rangeLabel, setRangeLabel] = useState('30D')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the sales report whenever the date range changes
  useEffect(() => {
    let cancelled = false

    async function loadReport() {
      try {
        setLoading(true)
        setError('')

        const range = ranges.find((r) => r.label === rangeLabel)
        const params = new URLSearchParams()
        if (range.days) {
          const start = new Date()
          start.setDate(start.getDate() - (range.days - 1))
          start.setHours(0, 0, 0, 0)
          params.set('startDate', start.toISOString())
        }
        const query = params.toString() ? `?${params.toString()}` : ''

        const res = await apiRequest(`/admin/reports/sales${query}`)
        if (!cancelled) setReport(res.data || null)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReport()
    return () => {
      cancelled = true
    }
  }, [rangeLabel])

  const dailyRows = useMemo(() => groupByDay(report?.dailyOrders), [report])
  const statusSummary = report?.statusSummary || []
  const totalOrders = report?.summary?.totalOrders ?? 0
  const deliveredCount =
    statusSummary.find((s) => s.status === 'DELIVERED')?.count ?? 0

  // Build a CSV file in the browser and download it
  const handleDownloadCsv = () => {
    const lines = []
    lines.push('Date,Orders,Order Value (INR)')
    for (const row of dailyRows) {
      lines.push(`${row.key},${row.orders},${row.value}`)
    }
    lines.push('')
    lines.push('Status,Count')
    for (const s of statusSummary) {
      lines.push(`${s.status},${s.count}`)
    }

    // BOM at the start helps Excel open the file correctly
    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-report-${rangeLabel}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#101A30]">Reports</h2>
          <p className="text-sm text-[#52647D] mt-1">Sales and order summary.</p>
        </div>
        <button
          onClick={handleDownloadCsv}
          disabled={loading || !report}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2864F0] text-white hover:bg-[#2878C8] transition disabled:opacity-50"
        >
          Download CSV
        </button>
      </div>

      {/* Date range tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
        {ranges.map((r) => (
          <button
            key={r.label}
            onClick={() => setRangeLabel(r.label)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              rangeLabel === r.label
                ? 'bg-[#2864F0] text-white'
                : 'bg-white text-[#101A30] hover:bg-[#E4E4F2]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-5 text-[#52647D]">Loading report...</p>
      ) : !report ? null : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3 mt-5">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-[#52647D]">Total Orders</p>
              <p className="text-2xl font-bold text-[#101A30] mt-2">{totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-[#52647D]">Order Value</p>
              <p className="text-2xl font-bold text-[#101A30] mt-2">
                {formatAmount(report.summary?.orderValue)}
              </p>
              <p className="text-xs text-[#52647D] mt-2">
                {report.summary?.orderValueDescription}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-[#52647D]">Delivered Orders</p>
              <p className="text-2xl font-bold text-[#101A30] mt-2">{deliveredCount}</p>
            </div>
          </div>

          {/* Status summary */}
          <div className="bg-white rounded-xl shadow-sm p-5 mt-5">
            <h3 className="font-semibold text-[#101A30]">Orders by Status</h3>
            {statusSummary.length === 0 ? (
              <p className="text-sm text-[#52647D] mt-3">No orders in this period.</p>
            ) : (
              <div className="flex flex-wrap gap-3 mt-4">
                {statusSummary.map((s) => (
                  <div
                    key={s.status}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
                      badgeColors[s.status] || ''
                    }`}
                  >
                    {formatStatus(s.status)}: {s.count}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily table */}
          <div className="mt-5 bg-white rounded-xl shadow-sm overflow-x-auto">
            <h3 className="font-semibold text-[#101A30] px-6 pt-5">Daily Orders</h3>
            {dailyRows.length === 0 ? (
              <p className="p-6 text-[#52647D]">No orders in this period.</p>
            ) : (
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr className="text-left text-[#52647D] border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Orders</th>
                    <th className="px-6 py-4 font-medium">Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((row) => (
                    <tr key={row.key} className="border-b border-gray-50 last:border-0">
                      <td className="px-6 py-4 text-[#101A30]">
                        {formatDayLabel(row.key)}
                      </td>
                      <td className="px-6 py-4 text-[#52647D]">{row.orders}</td>
                      <td className="px-6 py-4 text-[#101A30]">
                        {formatAmount(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminReports