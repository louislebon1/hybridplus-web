'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const row = 'flex items-center justify-between w-full px-5 py-3.5 border-b border-text/[0.06] text-left last:border-b-0'

export default function ProfilePage() {
  const router = useRouter()

  return (
    <div>
      <div>
        <h1>Profile</h1>
      </div>

      <div>

        {/* Account section */}
        <div>
          <p>Account</p>
        </div>
        <div>
          <button onClick={() => router.push('/profile/edit')}>
            <span>Edit Profile</span>
            <ChevronRight size={16} />
          </button>
          <button>
            <span>Notifications</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* App section */}
        <div>
          <p>App</p>
        </div>
        <div>
          <button>
            <span>Units</span>
            <div>
              <span>kg</span>
              <ChevronRight size={16} />
            </div>
          </button>
          <button>
            <span>Privacy Policy</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
