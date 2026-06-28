'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Dumbbell, Activity, BarChart2 } from 'lucide-react'

const TABS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/programmes', label: 'Train', icon: Dumbbell },
  { href: '/calendar', label: 'Plan', icon: Calendar },
  { href: '/cardio', label: 'Cardio', icon: Activity },
  { href: '/progress', label: 'Progress', icon: BarChart2 },
]

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      <nav
        style={{
          flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.03)',
          borderTop: '1px solid rgba(255, 255, 255, 0.03)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '52px', height: '42px', justifyContent: 'center', textDecoration: 'none' }}
              >
                <Icon
                  size={24}
                  style={{ color: active ? '#00BD44' : '#FFFFFF', opacity: active ? 1 : 0.6 }}
                />
                <span style={{
                  fontFamily: 'var(--font-geist-sans)',
                  fontSize: '8px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: active ? '#00BD44' : 'rgba(255, 255, 255, 0.4)',
                  textAlign: 'center',
                  width: '52px',
                  lineHeight: '10px',
                }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
