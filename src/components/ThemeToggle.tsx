import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeToggle() {
  const isDark = useThemeStore((state) => state.isDark)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
