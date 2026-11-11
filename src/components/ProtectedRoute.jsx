// File: src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'

// Home page path for each role
const dashboardByRole = {
  CUSTOMER: '/customer',
  SELLER: '/seller',
  ADMIN: '/admin',
}

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'))
  } catch {
    return null
  }
}

// allowedRoles: optional list of roles allowed to open the nested routes
function ProtectedRoute({ allowedRoles }) {
  const token = sessionStorage.getItem('accessToken')
  const user = getStoredUser()

  // Not logged in -> go to login page
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but wrong role -> go to own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardByRole[user.role] || '/'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute