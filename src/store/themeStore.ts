import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  initializeTheme: () => void
  toggleTheme: () => void
}

const getPreferredTheme = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const savedTheme = window.localStorage.getItem('theme')
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme === 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const applyThemeClass = (isDark: boolean) => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', isDark)
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  initializeTheme: () => {
    const isDark = getPreferredTheme()
    applyThemeClass(isDark)

    if (get().isDark !== isDark) {
      set({ isDark })
    }
  },
  toggleTheme: () =>
    set((state) => {
      const newIsDark = !state.isDark
      applyThemeClass(newIsDark)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
      }

      return { isDark: newIsDark }
    }),
}))
