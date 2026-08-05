'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const TABS = [
  { href: '/home',       inactive: '/nav-home.svg',         active: '/nav-home-active.svg'     },
  { href: '/programmes', inactive: '/nav-workouts.svg',     active: '/nav-workouts-active.svg' },
  { href: '/progress',   inactive: '/nav-progress.svg',     active: '/nav-progress-active.svg' },
  { href: '/profile',    inactive: '/nav-user.svg',         active: '/nav-user-active.svg'     },
]

// Nav pill height (48px) + bottom padding (24px) + breathing room (8px)
const NAV_CLEARANCE = 80

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <main style={{ flex: 1, minHeight: 0, paddingBottom: NAV_CLEARANCE, overflow: 'hidden' }}>
        {children}
      </main>

      {/* Floating pill nav — fixed so it always sits above content */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: '24px',
        pointerEvents: 'none',
      }}>
        <nav style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '2px',
          padding: '6px',
          width: '272px',
          borderRadius: '200px',
          // Same liquid-glass material as the card surfaces.
          background: 'var(--bg-card)',
          WebkitBackdropFilter: 'blur(36px) saturate(180%) brightness(1.12)',
          backdropFilter: 'blur(36px) saturate(180%) brightness(1.12)',
          boxShadow: [
            'inset 0 1.5px 1px -1px rgba(255, 255, 255, 0.55)',
            'inset 0 -1.5px 1px -1px rgba(0, 0, 0, 0.35)',
            'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            '0 8px 32px rgba(0, 0, 0, 0.5)',
          ].join(', '),
          pointerEvents: 'auto',
        }}>
          {TABS.map(({ href, inactive, active }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  borderRadius: '200px',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  transition: 'background-color 150ms ease-out',
                  textDecoration: 'none',
                }}
              >
                <Image
                  src={isActive ? active : inactive}
                  alt=""
                  width={24}
                  height={24}
                  style={{ display: 'block' }}
                />
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
