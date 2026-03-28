'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function ScrollTransition() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="scroll-transition relative overflow-hidden py-10"
      aria-hidden="true"
    >
      {/* Gradient fade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand/5 to-transparent" />

      {/* Animated content */}
      <div
        className={[
          'relative flex flex-col items-center gap-2 transition-all duration-700',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        ].join(' ')}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Dive into the data
        </p>
        <ChevronDown className="size-5 animate-bounce text-brand" />
      </div>

      {/* Decorative grid lines */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}
