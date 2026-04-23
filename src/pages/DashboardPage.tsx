import { useAuthStore } from '@/store/authStore'
import { useDbStore } from '@/data/db'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Phone, ShoppingCart, Package, Building2 } from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const businesses = useDbStore((state) => state.businesses)
  const products = useDbStore((state) => state.products)
  const callLeads = useDbStore((state) => state.callLeads)
  const orders = useDbStore((state) => state.orders)

  // Dummy chart data
  const orderTrendsData = [
    { name: 'Mon', orders: 4, calls: 24 },
    { name: 'Tue', orders: 3, calls: 13 },
    { name: 'Wed', orders: 2, calls: 29 },
    { name: 'Thu', orders: 2, calls: 22 },
    { name: 'Fri', orders: 6, calls: 39 },
    { name: 'Sat', orders: 5, calls: 35 },
    { name: 'Sun', orders: 7, calls: 42 },
  ]

  const callStatusData = [
    { name: 'Read', value: callLeads.filter(l => l.status === 'read').length || 45, color: '#10B981' },
    { name: 'Unread', value: callLeads.filter(l => l.status === 'unread').length || 25, color: '#F59E0B' },
  ]

  const totalBusinesses = businesses.length
  const totalProducts = products.length
  const totalCalls = callLeads.length
  const totalOrders = orders.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'super-admin' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-sky-200/50 dark:border-sky-500/20 sky-glow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                  Total Businesses
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalBusinesses}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Building2 className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </div>
        )}

        {user?.role === 'super-admin' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-sky-200/50 dark:border-sky-500/20 sky-glow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalProducts}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Package className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-sky-200/50 dark:border-sky-500/20 sky-glow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                Total Calls
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalCalls}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Phone className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-sky-200/50 dark:border-sky-500/20 sky-glow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                Total Orders
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalOrders}
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
              <ShoppingCart className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Trends Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-sky-200/50 dark:border-sky-500/20 sky-glow">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Weekly Trends
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orderTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2} />
              <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Call Status Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-sky-200/50 dark:border-sky-500/20 sky-glow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Call Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={callStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {callStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-2">
            {callStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
