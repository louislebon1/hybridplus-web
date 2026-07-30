'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Activity, BarChart2, User } from 'lucide-react'

const TABS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/programmes', label: 'Programmes', icon: Activity },
  { href: '/progress', label: 'Progress', icon: BarChart2 },
  { href: '/profile', label: 'Profile', icon: User },
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
          background: '#FFFEFA',
          borderTop: '1px solid rgba(17, 17, 17, 0.08)',
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
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '52px', height: '42px', justifyContent: 'center', textDecoration: 'none' }}
              >
                <Icon
                  size={22}
                  style={{ color: active ? '#3B948F' : '#111111', opacity: active ? 1 : 0.35 }}
                />
                <span style={{
                  fontFamily: 'var(--font-geist-sans)',
                  fontSize: '9px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: active ? '#3B948F' : 'rgba(17,17,17,0.4)',
                  textAlign: 'center',
                  width: '52px',
                  lineHeight: '11px',
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
