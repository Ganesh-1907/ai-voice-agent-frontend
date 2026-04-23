import { ReactNode, useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) return saved === 'true'
    return window.innerWidth < 1024
  })

  // Listen for sidebar toggle changes via localStorage
  useEffect(() => {
    const onStorage = () => {
      const val = localStorage.getItem('sidebar-collapsed')
      setSidebarCollapsed(val === 'true')
    }

    // Poll for changes since storage event doesn't fire in same tab
    const interval = setInterval(() => {
      const val = localStorage.getItem('sidebar-collapsed')
      setSidebarCollapsed(val === 'true')
    }, 200)

    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }, [])

  const marginLeft = sidebarCollapsed ? '68px' : '256px'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft }}
      >
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
