'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const GROUPS = [
  { key: 'Dairy', rows: ['Cheese', 'Milk', 'Yogurt'] },
  { key: 'Poultry', rows: ['Chicken Breast', 'Turkey'] },
]

export function GroupAnim() {
  const [grouped, setGrouped] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'opening' | 'selecting' | 'grouped' | 'collapsing' | 'resetting'>('idle')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'idle') {
      timeout = setTimeout(() => {
        setDropdownOpen(true)
        setPhase('opening')
      }, 600)
    } else if (phase === 'opening') {
      timeout = setTimeout(() => setPhase('selecting'), 700)
    } else if (phase === 'selecting') {
      setDropdownOpen(false)
      setGrouped(true)
      setPhase('grouped')
    } else if (phase === 'grouped') {
      timeout = setTimeout(() => {
        setCollapsed(new Set(['Dairy']))
        setPhase('collapsing')
      }, 1600)
    } else if (phase === 'collapsing') {
      timeout = setTimeout(() => setPhase('resetting'), 1600)
    } else if (phase === 'resetting') {
      timeout = setTimeout(() => {
        setGrouped(false)
        setCollapsed(new Set())
        setDropdownOpen(false)
        setPhase('idle')
      }, 400)
    }

    return () => clearTimeout(timeout)
  }, [phase])

  return (
    <div className="w-full max-w-xs mx-auto select-none text-xs space-y-2">
      {/* Group-by selector */}
      <div className="relative inline-block">
        <div className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-input bg-background text-xs cursor-pointer">
          Group by: <span className="font-medium">{grouped ? 'Food Group' : 'None'}</span>
          <ChevronDown className="size-3" />
        </div>
        {dropdownOpen && (
          <div className="absolute top-full mt-1 rounded-md border border-border bg-popover shadow-md z-10 min-w-[9rem]">
            <div className="px-2.5 py-1.5 text-muted-foreground cursor-pointer hover:bg-accent">
              None
            </div>
            <div className="px-2.5 py-1.5 bg-accent font-medium cursor-pointer">
              Food Group
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        {grouped ? (
          GROUPS.map((group) => {
            const isCollapsed = collapsed.has(group.key)
            return (
              <div key={group.key}>
                <div className="px-2 py-1.5 bg-muted/60 flex items-center gap-1.5 font-semibold cursor-pointer border-b border-border/50 first:border-0">
                  <ChevronDown
                    className={`size-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                  {group.key}
                  <span className="font-normal text-muted-foreground">({group.rows.length})</span>
                </div>
                {!isCollapsed &&
                  group.rows.map((row) => (
                    <div key={row} className="px-4 py-1.5 border-b border-border/50 last:border-0">
                      {row}
                    </div>
                  ))}
              </div>
            )
          })
        ) : (
          GROUPS.flatMap((g) => g.rows).map((row, i) => (
            <div key={row} className={`px-2 py-1.5 ${i > 0 ? 'border-t border-border/50' : ''}`}>
              {row}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
