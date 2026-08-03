'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'

const FONT = 'var(--font-geist-sans)'

export default function NewSessionPage() {
  const router = useRouter()
  const { sessionType, setSessionType, reset } = useSessionWizard()

  function handleClose() {
    reset()
    router.back()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT, background: '#FFFEFA' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 16px 24px', borderBottom: '1px solid rgba(17,17,17,0.05)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          New session
        </h1>
        <button
          onClick={handleClose}
          style={{ width: '32px', height: '32px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} color="#3B948F" />
        </button>
      </div>

      {/* Type toggle */}
      <div style={{ padding: '24px 16px 12px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', padding: '4px', borderRadius: '40px',
          background: 'rgba(17,17,17,0.05)', border: '1px solid rgba(252,253,255,0.04)', gap: '4px',
        }}>
          {(['strength', 'cardio'] as const).map(t => {
            const active = t === sessionType
            return (
              <button
                key={t}
                onClick={() => setSessionType(t)}
                style={{
                  flex: 1, padding: '8px 24px', borderRadius: '40px',
                  background: active ? '#FFFEFA' : 'transparent',
                  border: active ? '1px solid rgba(252,253,255,0.04)' : '1px solid transparent',
                  opacity: active ? 1 : 0.4,
                  cursor: 'pointer',
                  fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px',
                  color: active ? '#3B948F' : '#111111',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <button
          onClick={() => router.push('/sessions/new/exercises')}
          style={{
            width: '100%', height: '48px', borderRadius: '40px',
            border: '1px solid #3B948F', background: '#3B948F',
            cursor: 'pointer', fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px',
            color: '#FFFEFA',
          }}
        >
          Add exercises to workout
        </button>
      </div>

    </div>
  )
}
