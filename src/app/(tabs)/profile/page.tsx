'use client'

import { useRouter } from 'next/navigation'
import { LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const label10: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans)',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(17,17,17,0.4)',
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  borderBottom: '1px solid rgba(17,17,17,0.06)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
}

export default function ProfilePage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth/sign-in')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 20px 16px', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '20px', fontWeight: 500, lineHeight: '28px', color: '#111111' }}>
          Profile
        </h1>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>

        {/* Account section */}
        <div style={{ padding: '0 20px 8px' }}>
          <p style={label10}>Account</p>
        </div>
        <div style={{ background: 'rgba(17,17,17,0.03)', border: '1px solid rgba(17,17,17,0.08)', borderRadius: '12px', margin: '0 16px', overflow: 'hidden' }}>
          <button style={row}>
            <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500, color: '#111111' }}>Edit Profile</span>
            <ChevronRight size={16} style={{ color: 'rgba(17,17,17,0.3)' }} />
          </button>
          <button style={{ ...row, borderBottom: 'none' }}>
            <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500, color: '#111111' }}>Notifications</span>
            <ChevronRight size={16} style={{ color: 'rgba(17,17,17,0.3)' }} />
          </button>
        </div>

        {/* App section */}
        <div style={{ padding: '20px 20px 8px' }}>
          <p style={label10}>App</p>
        </div>
        <div style={{ background: 'rgba(17,17,17,0.03)', border: '1px solid rgba(17,17,17,0.08)', borderRadius: '12px', margin: '0 16px', overflow: 'hidden' }}>
          <button style={row}>
            <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500, color: '#111111' }}>Units</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12px', color: 'rgba(17,17,17,0.4)' }}>kg</span>
              <ChevronRight size={16} style={{ color: 'rgba(17,17,17,0.3)' }} />
            </div>
          </button>
          <button style={{ ...row, borderBottom: 'none' }}>
            <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500, color: '#111111' }}>Privacy Policy</span>
            <ChevronRight size={16} style={{ color: 'rgba(17,17,17,0.3)' }} />
          </button>
        </div>

        {/* Sign out */}
        <div style={{ padding: '20px 16px 0' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', height: '48px', borderRadius: '40px',
              background: 'transparent', border: '1px solid #111111',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 600, color: '#111111',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
