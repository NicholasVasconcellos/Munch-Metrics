'use client'

import { useEffect, useState } from 'react'
import { Columns3 } from 'lucide-react'

const ALL_COLS = ['Calories', 'Protein', 'Fat', 'Carbs', 'Fiber', 'Sodium']
const DEFAULT_COLS = ['Calories', 'Protein', 'Fat', 'Carbs']
const EXTRAS = ['Fiber', 'Sodium']

export function ColumnsAnim() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(DEFAULT_COLS)
  const [phase, setPhase] = useState<'idle' | 'opening' | 'toggling' | 'showing' | 'resetting'>('idle')
  const [toggleIdx, setToggleIdx] = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'idle') {
      timeout = setTimeout(() => {
        setOpen(true)
        setPhase('opening')
      }, 600)
    } else if (phase === 'opening') {
      timeout = setTimeout(() => setPhase('toggling'), 400)
    } else if (phase === 'toggling') {
      if (toggleIdx < EXTRAS.length) {
        timeout = setTimeout(() => {
          setVisible((prev) => [...prev, EXTRAS[toggleIdx]])
          setToggleIdx((i) => i + 1)
        }, 500)
      } else {
        timeout = setTimeout(() => {
          setOpen(false)
          setPhase('showing')
        }, 400)
      }
    } else if (phase === 'showing') {
      timeout = setTimeout(() => setPhase('resetting'), 1800)
    } else if (phase === 'resetting') {
      timeout = setTimeout(() => {
        setVisible(DEFAULT_COLS)
        setToggleIdx(0)
        setOpen(false)
        setPhase('idle')
      }, 400)
    }

    return () => clearTimeout(timeout)
  }, [phase, toggleIdx])

  return (
    <div className="w-full max-w-xs mx-auto select-none text-xs space-y-2">
      {/* Column picker button */}
      <div className="flex justify-end">
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-input bg-background text-xs cursor-pointer">
            <Columns3 className="size-3.5" />
            Columns
          </div>
          {open && (
            <div className="absolute top-full right-0 mt-1 rounded-md border border-border bg-popover shadow-md z-10 w-36 p-1.5">
              {ALL_COLS.map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-accent cursor-pointer"
                >
                  <div
                    className={`size-3 rounded border transition-colors ${
                      visible.includes(col) ? 'bg-brand border-brand' : 'border-input'
                    }`}
                  />
                  <span className="text-xs">{col}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mini table */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="flex border-b border-border bg-muted/40">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-14 shrink-0">
            Food
          </div>
          {visible.map((col) => (
            <div
              key={col}
              className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex-1 min-w-0 truncate"
            >
              {col.slice(0, 4)}
            </div>
          ))}
        </div>
        {['Beef', 'Eggs'].map((food) => (
          <div key={food} className="flex border-t border-border/50">
            <div className="px-2 py-1.5 w-14 shrink-0">{food}</div>
            {visible.map((col) => (
              <div key={col} className="px-2 py-1.5 flex-1 text-muted-foreground min-w-0">
                —
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
