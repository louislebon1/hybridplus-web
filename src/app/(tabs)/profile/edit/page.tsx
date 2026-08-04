'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useBodyMetricsStore } from '@/stores/body-metrics-store'
import { Input, Button, EmptyState } from '@/components/ui'
import { localDateStr } from '@/lib/date'

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function EditProfilePage() {
  const router = useRouter()
  const { heightCm, weightLogs, setHeight, logWeight, deleteWeightLog } = useBodyMetricsStore()

  const [heightInput, setHeightInput] = useState(heightCm?.toString() ?? '')
  const [weightDate, setWeightDate] = useState(localDateStr())
  const [weightInput, setWeightInput] = useState('')

  function handleHeightBlur() {
    const parsed = heightInput.trim() ? parseFloat(heightInput) : null
    setHeight(parsed !== null && !isNaN(parsed) ? parsed : null)
  }

  function handleLogWeight(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(weightInput)
    const validDate = weightDate && !isNaN(new Date(weightDate + 'T00:00:00').getTime())
    if (!validDate || isNaN(parsed) || parsed <= 0) return
    logWeight(weightDate, parsed)
    setWeightInput('')
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this weight entry?')) return
    deleteWeightLog(id)
  }

  const sortedLogs = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date))
  const chartLogs = sortedLogs.slice(-10)
  const weights = chartLogs.map(w => w.weightKg)
  const minW = weights.length ? Math.min(...weights) : 0
  const maxW = weights.length ? Math.max(...weights) : 0
  const range = maxW - minW || 1

  const latestWeight = sortedLogs[sortedLogs.length - 1]?.weightKg ?? null
  const heightM = heightCm ? heightCm / 100 : null
  const bmi = heightM && latestWeight ? latestWeight / (heightM * heightM) : null

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-7 pb-6 border-b border-border flex-shrink-0">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0">
          <ArrowLeft size={16} className="text-accent" />
        </button>
        <h1 className="text-h2 font-medium leading-[30px] text-text m-0">Edit Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">

        {/* Height */}
        <div className="flex flex-col gap-2">
          <label className="text-label font-medium leading-[18px] text-text">Height (cm)</label>
          <Input
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 178"
            value={heightInput}
            onChange={e => setHeightInput(e.target.value)}
            onBlur={handleHeightBlur}
          />
        </div>

        {/* Current stats */}
        {(latestWeight !== null || bmi !== null) && (
          <div className="flex gap-3">
            {latestWeight !== null && (
              <div className="flex-1 bg-bg-element border border-border rounded-2xl p-3 text-center">
                <p className="text-h3 font-medium text-text tabular">{latestWeight.toFixed(1)}</p>
                <p className="text-caption text-text-secondary mt-0.5">Weight (kg)</p>
              </div>
            )}
            {bmi !== null && (
              <div className="flex-1 bg-bg-element border border-border rounded-2xl p-3 text-center">
                <p className="text-h3 font-medium text-text tabular">{bmi.toFixed(1)}</p>
                <p className="text-caption text-text-secondary mt-0.5">BMI</p>
              </div>
            )}
          </div>
        )}

        {/* Log weight */}
        <form onSubmit={handleLogWeight} className="flex flex-col gap-3">
          <label className="text-label font-medium leading-[18px] text-text">Log weight</label>
          <div className="flex gap-3">
            <Input
              type="date"
              value={weightDate}
              onChange={e => setWeightDate(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="kg"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" disabled={!weightInput.trim()} className="w-full">
            Log weight
          </Button>
        </form>

        {/* Weight chart */}
        {chartLogs.length > 0 && (
          <div>
            <p className="eyebrow mb-3">Weight history</p>
            <div className="bg-bg-element border border-border rounded-2xl p-4">
              <div className="flex items-end gap-1.5">
                {chartLogs.map(w => {
                  const pct = ((w.weightKg - minW) / range) * 100
                  return (
                    <div key={w.id} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-24 flex items-end">
                        <div className="w-full rounded-t-sm bg-accent/20 relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                          <div className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-sm" style={{ height: '100%' }} />
                        </div>
                      </div>
                      <span className="text-tag text-text-tertiary tabular">{fmtDate(w.date)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Weight log list */}
        {sortedLogs.length > 0 && (
          <div>
            <p className="eyebrow mb-3">Entries</p>
            <div className="bg-bg-element border border-border rounded-2xl overflow-hidden">
              {[...sortedLogs].reverse().map((w, i) => (
                <div key={w.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <div>
                    <p className="text-label font-medium text-text">{w.weightKg.toFixed(1)} kg</p>
                    <p className="text-caption text-text-tertiary">{fmtDate(w.date)}</p>
                  </div>
                  <button onClick={() => handleDelete(w.id)} className="text-text-tertiary hover:text-error transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedLogs.length === 0 && (
          <EmptyState
            icon="⚖️"
            title="No weight logged yet"
            description="Log your first entry above to start tracking."
          />
        )}
      </div>
    </div>
  )
}
