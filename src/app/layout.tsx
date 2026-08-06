import type { Metadata, Viewport } from 'next'
import { Anton, Inter } from 'next/font/google'
import './globals.css'

/* Display voice: a heavy condensed grotesque, used only at size and only for
   figures and titles. Body: Inter, as this world's own board specifies. Both are
   self-hosted by next/font — no external request, no layout shift. */
const display = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' })
const body = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'HybridPlus',
  description: 'Hybrid athlete training tracker',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'HybridPlus' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0D12',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {/*
          THESIS: One thing owns the whole screen. Training is a sequence of single
          efforts, so the interface shows exactly one — this exercise, this set — at
          the scale it has in the room, and the next is one snap away. It refuses the
          dashboard: no grid of equal cards, no summary of everything at once.
          OWN-WORLD: Void #0B0D12 through Steel, lit by Scrim #E6E8EC. Film grain and
          a bottom scrim gradient are the only materials. Anton condensed caps for
          every figure and title, Inter for anything read rather than scanned. A
          right-hand rail of white glyphs is the only chrome.
          STORY: The athlete sees one exercise, does the work, logs it with a thumb on
          the rail, and flicks to the next. Progress reads the same way — one measure
          per screen, never a wall of them.
          FIRST VIEWPORT: Full-bleed field carrying this exercise's real set history as
          an ambient plot. Exercise name in condensed caps lower-left, working weight as
          the dominant figure above it, set chips beneath. Rail right: log set, rest,
          swap, notes. Snap indicator lower-right.
          FORM: Full-Bleed Vertical Media Surface — user-chosen over the assigned
          direction; candidate 4 of the dealt hand. Seed key d2229783.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the
          finish review, the verdict, and DESIGN.md
        */}
        {children}
      </body>
    </html>
  )
}
