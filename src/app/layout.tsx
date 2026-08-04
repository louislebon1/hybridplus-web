import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HybridPlus',
  description: 'Hybrid athlete training tracker',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'HybridPlus' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B0C0C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-bg text-text">
        <div className="flex justify-center h-full">
          <div className="w-full max-w-[430px] h-full relative flex flex-col overflow-hidden bg-bg">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
