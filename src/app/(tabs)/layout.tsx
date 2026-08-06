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
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
        pointerEvents: 'none'}}>
        <nav style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '2px',
          padding: '6px',
          width: '272px',
          borderRadius: '200px',
          background: 'rgba(35, 42, 54, 0.82)',
          border: '1px solid rgba(230, 232, 236, 0.10)',
          boxShadow: '0 10px 34px rgba(0, 0, 0, 0.55)',
          pointerEvents: 'auto'}}>
          {TABS.map(({ href, inactive, active }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link key={href}
                href={href}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  borderRadius: '200px',
                  background: isActive ? '#E6E8EC' : 'transparent',
                  transition: 'background-color 150ms ease-out',
                  textDecoration: 'none'}}>
                <Image src={isActive ? active : inactive}
                  alt=""
                  width={24}
                  height={24}
                  style={{ display: 'block' }} />
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
