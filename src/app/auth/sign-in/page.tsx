'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await createClient().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.replace('/home')
  }

  return (
    <div className="flex flex-col h-full bg-bg items-center justify-center px-6">
      <div className="w-full max-w-xs flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl text-text tracking-tight">HybridPlus</h1>
          <p className="text-text-secondary text-sm mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-error text-sm">{error}</p>}
          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'SIGN IN'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="text-accent">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
