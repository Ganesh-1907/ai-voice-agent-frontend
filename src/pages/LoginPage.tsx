import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/ThemeToggle'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const loginWithCredentials = useAuthStore((state) => state.loginWithCredentials)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Dummy validation
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setError('')

    setIsLoading(true)
    try {
      await loginWithCredentials(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
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
              disabled={isLoading}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
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
                <p className="text-gray-600 dark:text-gray-300">Email: superadmin@gmail.com</p>
                <p className="text-gray-600 dark:text-gray-300">Password: admin@123</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded text-xs space-y-1">
                <p><span className="font-semibold text-gray-900 dark:text-white">Business Admin:</span></p>
                <p className="text-gray-600 dark:text-gray-300">Email: admin@automart.local</p>
                <p className="text-gray-600 dark:text-gray-300">Password: admin@123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
