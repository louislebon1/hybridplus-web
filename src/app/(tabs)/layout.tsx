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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <main style={{ flex: 1, paddingBottom: NAV_CLEARANCE }}>
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
          gap: '4px',
          padding: '4px',
          width: '300px',
          borderRadius: '200px',
          border: '1px solid rgba(17, 17, 17, 0.05)',
          background: '#FFFEFA',
          boxShadow: '0px 0px 12px 4px rgba(17, 17, 17, 0.08)',
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
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '200px',
                  background: isActive ? 'rgba(17, 17, 17, 0.05)' : 'transparent',
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
