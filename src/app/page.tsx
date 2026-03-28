'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { DataTable } from '@/components/table/data-table'

const Hero = dynamic(() => import('@/components/landing/hero').then((m) => ({ default: m.Hero })))
const HowItWorks = dynamic(() =>
  import('@/components/landing/how-it-works').then((m) => ({ default: m.HowItWorks }))
)
const StatsBar = dynamic(() =>
  import('@/components/landing/stats-bar').then((m) => ({ default: m.StatsBar }))
)
const ScrollTransition = dynamic(() =>
  import('@/components/landing/scroll-transition').then((m) => ({ default: m.ScrollTransition }))
)
const TutorialModal = dynamic(() =>
  import('@/components/tutorial/tutorial-modal').then((m) => ({ default: m.TutorialModal }))
)
const TutorialTrigger = dynamic(() =>
  import('@/components/tutorial/tutorial-trigger').then((m) => ({ default: m.TutorialTrigger }))
)

export default function Home() {
  const [tutorialOpen, setTutorialOpen] = useState(false)

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Landing sections */}
        <Hero onOpenTutorial={() => setTutorialOpen(true)} />
        <HowItWorks />
        <StatsBar />
        <ScrollTransition />

        {/* Table section */}
        <div id="table-section" className="container mx-auto max-w-7xl px-4 py-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <DataTable />
          </Suspense>
        </div>
      </main>
      <Footer />

      {/* Tutorial modal — code-split */}
      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      {/* Floating help button with first-visit prompt */}
      <TutorialTrigger onOpen={() => setTutorialOpen(true)} />
    </>
  )
}
