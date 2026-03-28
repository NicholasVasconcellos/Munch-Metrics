'use client'

import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

const FILTERS = ['Vegan', 'High Protein', 'Gluten Free']

export function FilterAnim() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [checked, setChecked] = useState<string[]>([])
  const [chips, setChips] = useState<string[]>([])
  const [phase, setPhase] = useState<'idle' | 'opening' | 'checking' | 'applying' | 'showing' | 'resetting'>('idle')
  const [checkIdx, setCheckIdx] = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'idle') {
      timeout = setTimeout(() => {
        setPanelOpen(true)
        setPhase('opening')
      }, 600)
    } else if (phase === 'opening') {
      timeout = setTimeout(() => setPhase('checking'), 300)
    } else if (phase === 'checking') {
      if (checkIdx < FILTERS.length) {
        timeout = setTimeout(() => {
          setChecked((prev) => [...prev, FILTERS[checkIdx]])
          setCheckIdx((i) => i + 1)
        }, 500)
      } else {
        timeout = setTimeout(() => setPhase('applying'), 400)
      }
    } else if (phase === 'applying') {
      setChips([...FILTERS])
      setPanelOpen(false)
      setPhase('showing')
    } else if (phase === 'showing') {
      timeout = setTimeout(() => setPhase('resetting'), 2000)
    } else if (phase === 'resetting') {
      timeout = setTimeout(() => {
        setChecked([])
        setChips([])
        setCheckIdx(0)
        setPanelOpen(false)
        setPhase('idle')
      }, 400)
    }

    return () => clearTimeout(timeout)
  }, [phase, checkIdx])

  return (
    <div className="w-full max-w-xs mx-auto select-none space-y-2">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-input bg-background text-xs font-medium cursor-pointer">
          <SlidersHorizontal className="size-3" />
          Filters
        </div>
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full text-xs font-medium bg-secondary border border-border"
          >
            {chip}
            <X className="size-3 opacity-60" />
          </span>
        ))}
      </div>

      {/* Filter panel */}
      {panelOpen && (
        <div className="rounded-lg border border-border bg-popover p-3 shadow-md space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Dietary
          </p>
          {FILTERS.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
              <div
                className={`size-3.5 rounded border transition-colors ${
                  checked.includes(f) ? 'bg-brand border-brand' : 'border-input'
                }`}
              />
              {f}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
