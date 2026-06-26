'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error: err } = await createClient().auth.signUp({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center gap-4">
        <div className="text-5xl">✉️</div>
        <h2 className="text-xl text-text">Check your email</h2>
        <p className="text-text-secondary text-sm max-w-xs">
          We sent a confirmation link to <span className="text-text">{email}</span>. Click it to activate your account.
        </p>
        <Link href="/auth/sign-in" className="text-accent text-sm mt-2">Back to sign in</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg items-center justify-center px-6">
      <div className="w-full max-w-xs flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl text-text tracking-tight">HybridPlus</h1>
          <p className="text-text-secondary text-sm mt-2">Create your account</p>
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
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error && <p className="text-error text-sm">{error}</p>}
          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? 'Creating account…' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="text-accent">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
