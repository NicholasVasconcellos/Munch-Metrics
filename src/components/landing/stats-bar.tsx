'use client'

import { useEffect, useRef, useState } from 'react'

interface NumericStat {
  kind: 'numeric'
  target: number
  suffix: string
  label: string
}

interface TextStat {
  kind: 'text'
  value: string
  label: string
}

type Stat = NumericStat | TextStat

const STATS: Stat[] = [
  { kind: 'numeric', target: 8000, suffix: '+', label: 'Foods' },
  { kind: 'numeric', target: 40, suffix: '+', label: 'Nutrients' },
  { kind: 'text', value: 'Monthly', label: 'Price Data' },
  { kind: 'text', value: '100%', label: 'Free' },
]

function useCountUp(target: number, active: boolean, duration = 1200): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    let frameId: number
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [active, target, duration])

  return count
}

function NumericStatItem({ stat, active }: { stat: NumericStat; active: boolean }) {
  const count = useCountUp(stat.target, active)
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4">
      <span className="text-3xl font-bold tabular-nums text-brand md:text-4xl">
        {count.toLocaleString()}{stat.suffix}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
    </div>
  )
}

function TextStatItem({ stat }: { stat: TextStat }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4">
      <span className="text-3xl font-bold text-brand md:text-4xl">{stat.value}</span>
      <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
    </div>
  )
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="stats-bar border-y border-border/50 bg-brand/5"
      data-testid="stats-bar"
    >
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap items-center justify-center divide-x divide-border/50">
          {STATS.map((stat) =>
            stat.kind === 'numeric' ? (
              <NumericStatItem key={stat.label} stat={stat} active={active} />
            ) : (
              <TextStatItem key={stat.label} stat={stat} />
            )
          )}
        </div>
      </div>
    </div>
  )
}
