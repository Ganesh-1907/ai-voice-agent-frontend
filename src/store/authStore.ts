import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { User } from '@/types'
import { apiRequest } from '@/lib/api'

type BackendRole = 'super_admin' | 'owner' | 'admin' | 'staff'

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  expiresAt: number | null
  loginWithCredentials: (email: string, password: string) => Promise<void>
  setSession: (user: User, token: string) => void
  logout: () => void
  refreshProfile: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

type LoginResponse = {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
    role: BackendRole
    businessId: string | null
  }
}

type ProfileResponse = {
  id: string
  email: string
  name: string
  role: BackendRole
  businessId: string | null
  phone?: string | null
}

function normalizeRole(role: BackendRole): User['role'] {
  return role === 'super_admin' ? 'super-admin' : 'admin'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      expiresAt: null,
      setSession: (user: User, token: string) => {
        const expiresAt = Date.now() + 3600 * 1000
        set({ user, token, isLoggedIn: true, expiresAt })
      },
      loginWithCredentials: async (email: string, password: string) => {
        const result = await apiRequest<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        const expiresAt = Date.now() + 3600 * 1000
        set({
          token: result.accessToken,
          isLoggedIn: true,
          expiresAt,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: normalizeRole(result.user.role),
            businessId: result.user.businessId ?? undefined,
          },
        })
      },
      refreshProfile: async () => {
        const token = useAuthStore.getState().token
        if (!token) return
        const profile = await apiRequest<ProfileResponse>('/auth/me', { token })
        set((state) => ({
          ...state,
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: normalizeRole(profile.role),
            businessId: profile.businessId ?? undefined,
            phone: profile.phone ?? undefined,
          },
        }))
      },
      logout: () => set({ user: null, token: null, isLoggedIn: false, expiresAt: null }),
      updateUser: (userData: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        expiresAt: state.expiresAt,
      }),
    },
  ),
)
