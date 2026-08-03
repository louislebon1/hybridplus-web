'use client'

import { useRouter } from 'next/navigation'
import { LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const row = 'flex items-center justify-between w-full px-5 py-3.5 border-b border-text/[0.06] text-left last:border-b-0'

export default function ProfilePage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth/sign-in')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-h3 font-medium text-text">Profile</h1>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto pb-4">

        {/* Account section */}
        <div className="px-5 pb-2">
          <p className="eyebrow">Account</p>
        </div>
        <div className="bg-bg-element border border-text/[0.08] rounded-xl mx-4 overflow-hidden">
          <button className={row}>
            <span className="text-label font-medium text-text">Edit Profile</span>
            <ChevronRight size={16} className="text-text/30" />
          </button>
          <button className={row}>
            <span className="text-label font-medium text-text">Notifications</span>
            <ChevronRight size={16} className="text-text/30" />
          </button>
        </div>

        {/* App section */}
        <div className="px-5 pt-5 pb-2">
          <p className="eyebrow">App</p>
        </div>
        <div className="bg-bg-element border border-text/[0.08] rounded-xl mx-4 overflow-hidden">
          <button className={row}>
            <span className="text-label font-medium text-text">Units</span>
            <div className="flex items-center gap-1.5">
              <span className="text-caption font-medium text-text/40">kg</span>
              <ChevronRight size={16} className="text-text/30" />
            </div>
          </button>
          <button className={row}>
            <span className="text-label font-medium text-text">Privacy Policy</span>
            <ChevronRight size={16} className="text-text/30" />
          </button>
        </div>

        {/* Sign out */}
        <div className="px-4 pt-5">
          <button
            onClick={handleSignOut}
            className="w-full h-12 rounded-full bg-transparent border border-text flex items-center justify-center gap-2 text-label font-medium text-text"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
