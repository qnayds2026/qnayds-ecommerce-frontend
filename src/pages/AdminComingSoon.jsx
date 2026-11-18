// File: src/pages/AdminComingSoon.jsx
function AdminComingSoon({ title }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#101A30]">{title}</h2>
      <div className="mt-6 bg-white rounded-xl p-10 text-center shadow-sm">
        <div className="text-4xl mb-3">🚧</div>
        <p className="font-semibold text-[#101A30]">Coming soon</p>
        <p className="text-sm text-[#52647D] mt-1">
          This section will be available once the backend is ready.
        </p>
      </div>
    </div>
  )
}

export default AdminComingSoon