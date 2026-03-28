'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

const SEARCH_TEXT = 'chicken'
const SUGGESTIONS = ['Chicken Breast', 'Chicken Thigh', 'Chicken Wings']

export function SearchAnim() {
  const [typed, setTyped] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [phase, setPhase] = useState<'typing' | 'showing' | 'clearing'>('typing')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (typed.length < SEARCH_TEXT.length) {
        timeout = setTimeout(() => {
          setTyped(SEARCH_TEXT.slice(0, typed.length + 1))
        }, 120)
      } else {
        timeout = setTimeout(() => {
          setShowDropdown(true)
          setPhase('showing')
        }, 400)
      }
    } else if (phase === 'showing') {
      timeout = setTimeout(() => {
        setPhase('clearing')
        setShowDropdown(false)
      }, 2200)
    } else if (phase === 'clearing') {
      if (typed.length > 0) {
        timeout = setTimeout(() => {
          setTyped(typed.slice(0, -1))
        }, 60)
      } else {
        timeout = setTimeout(() => {
          setPhase('typing')
        }, 600)
      }
    }

    return () => clearTimeout(timeout)
  }, [phase, typed])

  return (
    <div className="w-full max-w-xs mx-auto select-none">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <div className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm flex items-center">
          <span>{typed}</span>
          <span className="inline-block w-px h-3.5 bg-foreground/70 ml-0.5 animate-pulse" />
        </div>
        {showDropdown && (
          <div className="absolute top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-md overflow-hidden z-10">
            {SUGGESTIONS.map((s) => (
              <div key={s} className="px-3 py-1.5 text-sm hover:bg-accent first:bg-accent/50">
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
