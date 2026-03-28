'use client'

import { Button } from '@/components/ui/button'
import { ArrowDown, Sparkles } from 'lucide-react'

interface HeroProps {
  onOpenTutorial: () => void
}

export function Hero({ onOpenTutorial }: HeroProps) {
  function handleExplore() {
    const el = document.getElementById('table-section')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 size-96 animate-pulse rounded-full bg-brand/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/3 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl px-4 text-center">
        {/* Eyebrow badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-medium text-brand">
          <Sparkles className="size-3.5" />
          <span>8,000+ foods &middot; 40+ nutrients &middot; Zero cost</span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Every nutrient.{' '}
          <span className="text-brand">Every food.</span>
          <br className="hidden sm:block" />
          {' '}One table.
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Search, filter, and sort a comprehensive nutritional database. Build custom
          metrics like protein-per-dollar and find the foods that match your goals.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="brand" onClick={handleExplore} className="gap-2 px-8">
            Explore Foods
            <ArrowDown className="size-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={onOpenTutorial} className="px-8">
            See How It Works
          </Button>
        </div>
      </div>
    </section>
  )
}
