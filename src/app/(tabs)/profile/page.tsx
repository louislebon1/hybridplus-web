'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Page } from '@/components/feed'

const row = 'flex items-center justify-between w-full px-5 py-3.5 border-b border-text/[0.06] text-left last:border-b-0'

export default function ProfilePage() {
  const router = useRouter()

  return (
    <Page>
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4 flex-shrink-0">
        <h1 className="display text-display m-0">Profile</h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-32">

        {/* Account section */}
        <p className="meta mb-2">Account</p>
        <div className="matt rounded-card overflow-hidden">
          <button onClick={() => router.push('/profile/edit')} className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left text-body text-scrim bg-transparent border-0 border-b border-scrim/8 last:border-b-0 cursor-pointer">
            <span>Edit Profile</span>
            <ChevronRight size={16} className="text-fog flex-shrink-0" />
          </button>
          <button className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left text-body text-scrim bg-transparent border-0 border-b border-scrim/8 last:border-b-0 cursor-pointer">
            <span>Notifications</span>
            <ChevronRight size={16} className="text-fog flex-shrink-0" />
          </button>
        </div>

        {/* App section */}
        <p className="meta mb-2 mt-7">App</p>
        <div className="matt rounded-card overflow-hidden">
          <button className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left text-body text-scrim bg-transparent border-0 border-b border-scrim/8 last:border-b-0 cursor-pointer">
            <span>Units</span>
            <div className="flex items-center gap-2 text-stone">
              <span className="meta">kg</span>
              <ChevronRight size={16} className="text-fog flex-shrink-0" />
            </div>
          </button>
          <button className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left text-body text-scrim bg-transparent border-0 border-b border-scrim/8 last:border-b-0 cursor-pointer">
            <span>Privacy Policy</span>
            <ChevronRight size={16} className="text-fog flex-shrink-0" />
          </button>
        </div>
      </div>
    </Page>
  )
}
