import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Dummy validation
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setError('')

    // Role-based login
    let dummyUser: User

    if (email === 'user@automart.com') {
      // Admin login — tied to a specific business
      dummyUser = {
        id: '2',
        email,
        name: 'Ahmed Khan',
        role: 'admin',
        businessId: '1',
        phone: '+1-555-0101',
      }
    } else {
      // Default to super-admin for any other email
      dummyUser = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: 'super-admin',
        phone: '+1234567890',
      }
    }

    login(dummyUser)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              CallAI
            </h1>
            <p className="text-gray-600 dark:text-gray-400">AI Call Handling SaaS</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
              Demo Credentials
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded text-xs space-y-1">
                <p><span className="font-semibold text-gray-900 dark:text-white">Super Admin:</span></p>
                <p className="text-gray-600 dark:text-gray-300">Email: admin@example.com</p>
                <p className="text-gray-600 dark:text-gray-300">Password: any password</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded text-xs space-y-1">
                <p><span className="font-semibold text-gray-900 dark:text-white">Business Admin:</span></p>
                <p className="text-gray-600 dark:text-gray-300">Email: user@automart.com</p>
                <p className="text-gray-600 dark:text-gray-300">Password: any password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
