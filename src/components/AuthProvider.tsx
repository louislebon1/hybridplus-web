'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const sb = createClient()

    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)
      setLoading(false)
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
