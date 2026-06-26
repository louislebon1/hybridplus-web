import { create } from 'zustand'
import { createClient } from '@/lib/supabase'

interface AuthUser {
  id: string
  email: string
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  setUser(user: AuthUser | null): void
  setLoading(v: boolean): void
  signOut(): Promise<void>
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoading: true,

  setUser(user) {
    set({ user })
  },

  setLoading(v) {
    set({ isLoading: v })
  },

  async signOut() {
    const client = createClient()
    await client.auth.signOut()
    set({ user: null })
  },
}))
