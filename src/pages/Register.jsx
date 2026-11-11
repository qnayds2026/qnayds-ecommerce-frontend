import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      setSuccess('Account created successfully! Redirecting to login...')

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Registration failed.')
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
          Create Account
        </h1>

        <p className="text-sm text-[#52647D] text-center mt-2">
          Join QNAYDS and start shopping
        </p>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-[#101A30] mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10"
            />
          </div>

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
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#2864F0] focus:ring-2 focus:ring-[#2864F0]/10"
            />
            <p className="text-xs text-[#52647D] mt-2">
              Use at least 8 characters, including a letter and a number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2864F0] hover:bg-[#2878C8] text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

        </form>

        <p className="text-center text-sm text-[#52647D] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2864F0] font-semibold hover:underline">
            Login
          </Link>
        </p>

        <Link to="/" className="block text-center text-sm text-[#52647D] mt-5 hover:text-[#2864F0]">
          ← Back to Home
        </Link>

      </div>
    </div>
  )
}

export default Register