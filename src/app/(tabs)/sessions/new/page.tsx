'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useTemplateStore } from '@/stores/template-store'
import type { ActivityType } from '@/types'

const FONT = 'var(--font-geist-sans)'

const ACTIVITY_TYPES: ActivityType[] = ['run', 'swim', 'cycle', 'walk', 'row']

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(17,17,17,0.1)',
  background: 'rgba(17,17,17,0.03)',
  fontFamily: FONT,
  fontSize: '16px',
  fontWeight: 500,
  lineHeight: '24px',
  color: '#111111',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '18px',
  color: '#111111',
}

function SessionNewContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { addStrengthTemplate, addCardioTemplate } = useTemplateStore()

  const initialType = searchParams.get('type') === 'cardio' ? 'cardio' : 'strength'

  const [type,           setType]           = useState<'strength' | 'cardio'>(initialType as 'strength' | 'cardio')
  const [name,           setName]           = useState('')
  const [activityType,   setActivityType]   = useState<ActivityType>('run')
  const [targetDuration, setTargetDuration] = useState('')
  const [targetDistance, setTargetDistance] = useState('')

  const canSubmit = name.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (type === 'strength') {
      addStrengthTemplate({ name: name.trim() })
    } else {
      addCardioTemplate({
        name: name.trim(),
        activityType,
        targetDurationMinutes: targetDuration ? parseInt(targetDuration) : null,
        targetDistanceKm:      targetDistance ? parseFloat(targetDistance) : null,
      })
    }
    router.back()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '28px 16px 0', flexShrink: 0 }}>
        <button
          onClick={() => router.back()}
          style={{ width: '32px', height: '32px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <ArrowLeft size={16} color="#3B948F" />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          New Session
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >

        {/* Type toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={labelStyle}>Session type</span>
          <div style={{ display: 'flex', padding: '4px', borderRadius: '40px', background: 'rgba(17,17,17,0.05)', gap: '4px' }}>
            {(['strength', 'cardio'] as const).map(t => {
              const isActive = t === type
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: '8px 24px', borderRadius: '40px',
                    background: isActive ? '#FFFEFA' : 'transparent',
                    border: isActive ? '1px solid rgba(252,253,255,0.04)' : '1px solid transparent',
                    opacity: isActive ? 1 : 0.4, cursor: 'pointer',
                    fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px',
                    color: isActive ? '#3B948F' : '#111111',
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Session name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Session name</label>
          <input
            autoFocus
            placeholder={type === 'strength' ? 'e.g. Upper Body A' : 'e.g. Easy Run'}
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Cardio-only fields */}
        {type === 'cardio' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>Activity</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ACTIVITY_TYPES.map(a => {
                  const isActive = a === activityType
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setActivityType(a)}
                      style={{
                        padding: '8px 16px', borderRadius: '40px', cursor: 'pointer',
                        background: isActive ? '#3B948F' : 'rgba(17,17,17,0.05)',
                        border: 'none',
                        fontFamily: FONT, fontSize: '14px', fontWeight: 500,
                        color: isActive ? '#FFFEFA' : '#111111',
                        opacity: isActive ? 1 : 0.6,
                      }}
                    >
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>
                  Target duration{' '}
                  <span style={{ color: 'rgba(17,17,17,0.4)' }}>(mins)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={targetDuration}
                  onChange={e => setTargetDuration(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>
                  Target distance{' '}
                  <span style={{ color: 'rgba(17,17,17,0.4)' }}>(km)</span>
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="5.0"
                  value={targetDistance}
                  onChange={e => setTargetDistance(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </>
        )}

        {/* Submit */}
        <div style={{ marginTop: '8px' }}>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '40px',
              border: 'none',
              background: canSubmit ? '#3B948F' : 'rgba(17,17,17,0.1)',
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: FONT,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '24px',
              color: canSubmit ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
            }}
          >
            Create Session
          </button>
        </div>

      </form>
    </div>
  )
}

export default function SessionNewPage() {
  return (
    <Suspense>
      <SessionNewContent />
    </Suspense>
  )
}
