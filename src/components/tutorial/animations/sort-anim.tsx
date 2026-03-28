'use client'

import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const ROWS = [
  { name: 'Almonds', protein: 21 },
  { name: 'Beef', protein: 26 },
  { name: 'Chicken', protein: 31 },
]

export function SortAnim() {
  const [direction, setDirection] = useState<'none' | 'asc' | 'desc'>('none')
  const [highlight, setHighlight] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'click-asc' | 'sorted-asc' | 'click-desc' | 'sorted-desc' | 'resetting'>('idle')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'idle') {
      timeout = setTimeout(() => setPhase('click-asc'), 800)
    } else if (phase === 'click-asc') {
      setHighlight(true)
      timeout = setTimeout(() => {
        setHighlight(false)
        setDirection('asc')
        setPhase('sorted-asc')
      }, 350)
    } else if (phase === 'sorted-asc') {
      timeout = setTimeout(() => setPhase('click-desc'), 1600)
    } else if (phase === 'click-desc') {
      setHighlight(true)
      timeout = setTimeout(() => {
        setHighlight(false)
        setDirection('desc')
        setPhase('sorted-desc')
      }, 350)
    } else if (phase === 'sorted-desc') {
      timeout = setTimeout(() => setPhase('resetting'), 1600)
    } else if (phase === 'resetting') {
      timeout = setTimeout(() => {
        setDirection('none')
        setPhase('idle')
      }, 400)
    }

    return () => clearTimeout(timeout)
  }, [phase])

  const rows = direction === 'desc' ? [...ROWS].reverse() : ROWS

  return (
    <div className="w-full max-w-xs mx-auto select-none text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Food
            </th>
            <th
              className={`px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                highlight ? 'text-brand' : 'text-muted-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-0.5">
                Protein
                {direction === 'asc' && <ChevronUp className="size-3" />}
                {direction === 'desc' && <ChevronDown className="size-3" />}
                {direction === 'none' && <ChevronsUpDown className="size-3 opacity-30" />}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/50 transition-all duration-300">
              <td className="px-2 py-1.5">{row.name}</td>
              <td className="px-2 py-1.5 tabular-nums">{row.protein}g</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
