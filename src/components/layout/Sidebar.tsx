import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/cn'
import {
  LayoutDashboard,
  Building2,
  Package,
  Phone,
  ShoppingCart,
  PhoneCall,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) return saved === 'true'
    return window.innerWidth < 1024
  })

  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const menuItems = user?.role === 'super-admin'
    ? [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: Building2, label: 'Businesses', href: '/businesses' },
        { icon: Package, label: 'Products', href: '/products' },
        { icon: Phone, label: 'Call Leads', href: '/call-leads' },
        { icon: ShoppingCart, label: 'Orders', href: '/orders' },
        { icon: PhoneCall, label: 'Callback Requests', href: '/callbacks' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: Package, label: 'Products', href: '/products' },
        { icon: Phone, label: 'Call Leads', href: '/call-leads' },
        { icon: ShoppingCart, label: 'Orders', href: '/orders' },
        { icon: PhoneCall, label: 'Callback Requests', href: '/callbacks' },
      ]

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col bg-slate-50 dark:bg-slate-900 sky-border-r transition-all duration-300 ease-in-out z-40 overflow-hidden',
        isCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 border-b border-gray-200 dark:border-gray-700/60 shrink-0',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
      )}>
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
              CallAI
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">SaaS Platform</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
            'hover:bg-gray-200/70 dark:hover:bg-slate-700/70'
          )}
        >
          {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-2.5',
                isActive
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        'shrink-0 border-t border-gray-200 dark:border-gray-700/60 p-3',
        isCollapsed ? 'flex justify-center' : ''
      )}>
        <div className={cn(
          'flex items-center gap-3',
          isCollapsed ? 'justify-center' : 'px-2'
        )}>
          <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role === 'super-admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// Export collapsed width for layout
export const SIDEBAR_EXPANDED_WIDTH = 256 // w-64
export const SIDEBAR_COLLAPSED_WIDTH = 68
