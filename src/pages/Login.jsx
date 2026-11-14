
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      const { user, accessToken } = response

      sessionStorage.setItem('accessToken', accessToken)
      sessionStorage.setItem('user', JSON.stringify(user))

      if (user.role === 'CUSTOMER') {
        navigate('/customer')
      } else if (user.role === 'SELLER') {
        navigate('/seller')
      } else if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        setError('Invalid user role.')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F0F8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <Link to="/" className="block text-center text-3xl font-bold text-[#2864F0]">
          QNAYDS
        </Link>

        <h1 className="text-2xl font-bold text-[#101A30] text-center mt-8">
          Welcome Back!
        </h1>

        <p className="text-sm text-[#52647D] text-center mt-2">
          Login to continue shopping
        </p>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-[#101A30] mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#101A30] mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2864F0] transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9 7 9 7a13 13 0 0 1-3 3.5" />
                    <path d="M6.6 6.6C4.2 8 3 12 3 12s4 7 9 7a9.8 9.8 0 0 0 4-.8" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2864F0] hover:bg-[#2878C8] text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="text-center text-sm text-[#52647D] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#2864F0] font-semibold hover:underline">
            Create Account
          </Link>
        </p>

        <Link to="/" className="block text-center text-sm text-[#52647D] mt-5 hover:text-[#2864F0]">
          ← Back to Home
        </Link>

      </div>
    </div>
  )
}

export default Login
