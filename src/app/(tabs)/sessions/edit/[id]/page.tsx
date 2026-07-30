'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
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

export default function EditSessionPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { strengthTemplates, cardioTemplates, updateStrengthTemplate, updateCardioTemplate, deleteStrengthTemplate, deleteCardioTemplate } = useTemplateStore()

  const strength = strengthTemplates.find(t => t.id === id)
  const cardio   = cardioTemplates.find(t => t.id === id)

  // Strength state
  const [sName, setSName] = useState(strength?.name ?? '')

  // Cardio state
  const [cName,           setCName]           = useState(cardio?.name ?? '')
  const [activityType,    setActivityType]    = useState<ActivityType>(cardio?.activityType ?? 'run')
  const [targetDuration,  setTargetDuration]  = useState(cardio?.targetDurationMinutes?.toString() ?? '')
  const [targetDistance,  setTargetDistance]  = useState(cardio?.targetDistanceKm?.toString() ?? '')

  if (!strength && !cardio) {
    router.back()
    return null
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (strength) {
      if (!sName.trim()) return
      updateStrengthTemplate(id, { name: sName.trim() })
    } else if (cardio) {
      if (!cName.trim()) return
      updateCardioTemplate(id, {
        name:                  cName.trim(),
        activityType,
        targetDurationMinutes: targetDuration ? parseInt(targetDuration) : null,
        targetDistanceKm:      targetDistance ? parseFloat(targetDistance) : null,
      })
    }
    router.back()
  }

  function handleDelete() {
    if (!window.confirm('Delete this session template? This cannot be undone.')) return
    if (strength) deleteStrengthTemplate(id)
    else if (cardio) deleteCardioTemplate(id)
    router.back()
  }

  const canSave = strength ? sName.trim().length > 0 : cName.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '8px' }}
          >
            <ArrowLeft size={20} color="#111111" />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
            Edit Session
          </h1>
        </div>
        <button
          onClick={handleDelete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '8px' }}
        >
          <Trash2 size={20} color="rgba(17,17,17,0.4)" />
        </button>
      </div>

      <form
        onSubmit={handleSave}
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >

        {/* Strength form */}
        {strength && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Session name</label>
            <input
              autoFocus
              value={sName}
              onChange={e => setSName(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        {/* Cardio form */}
        {cardio && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>Session name</label>
              <input
                autoFocus
                value={cName}
                onChange={e => setCName(e.target.value)}
                style={inputStyle}
              />
            </div>

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

        {/* Save */}
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <button
            type="submit"
            disabled={!canSave}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '40px',
              border: 'none',
              background: canSave ? '#3B948F' : 'rgba(17,17,17,0.1)',
              cursor: canSave ? 'pointer' : 'default',
              fontFamily: FONT,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '24px',
              color: canSave ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
            }}
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  )
}
