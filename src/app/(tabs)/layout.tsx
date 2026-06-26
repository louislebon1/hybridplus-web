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
        className="no-radius flex-shrink-0 border-t border-border bg-bg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center gap-0.5 py-4 px-1 text-center"
              >
                <Icon
                  size={22}
                  className={active ? 'text-accent' : 'text-text-tertiary'}
                />
                <span
                  className={`text-[10px] font-normal tracking-wide ${
                    active ? 'text-accent' : 'text-text-tertiary'
                  }`}
                >
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
