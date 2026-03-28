'use client'

import { useEffect, useState } from 'react'
import { Download, Link, Check } from 'lucide-react'

export function ExportAnim() {
  const [csvActive, setCsvActive] = useState(false)
  const [copyActive, setCopyActive] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'csv-click' | 'csv-toast' | 'link-click' | 'link-toast' | 'reset'>('idle')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'idle') {
      timeout = setTimeout(() => setPhase('csv-click'), 700)
    } else if (phase === 'csv-click') {
      setCsvActive(true)
      timeout = setTimeout(() => {
        setCsvActive(false)
        setToast('foods-export.csv downloaded')
        setPhase('csv-toast')
      }, 600)
    } else if (phase === 'csv-toast') {
      timeout = setTimeout(() => {
        setToast(null)
        setPhase('link-click')
      }, 1600)
    } else if (phase === 'link-click') {
      setCopyActive(true)
      timeout = setTimeout(() => {
        setCopyActive(false)
        setToast('Link copied to clipboard!')
        setPhase('link-toast')
      }, 600)
    } else if (phase === 'link-toast') {
      timeout = setTimeout(() => {
        setToast(null)
        setPhase('reset')
      }, 1600)
    } else if (phase === 'reset') {
      timeout = setTimeout(() => setPhase('idle'), 500)
    }

    return () => clearTimeout(timeout)
  }, [phase])

  return (
    <div className="w-full max-w-xs mx-auto select-none space-y-3">
      <div className="flex items-center gap-2">
        <button
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-medium transition-all duration-150 ${
            csvActive
              ? 'border-brand bg-brand text-brand-foreground scale-105 shadow-sm'
              : 'border-input bg-background'
          }`}
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
        <button
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-medium transition-all duration-150 ${
            copyActive
              ? 'border-brand bg-brand text-brand-foreground scale-105 shadow-sm'
              : 'border-input bg-background'
          }`}
        >
          {copyActive ? <Check className="size-3.5" /> : <Link className="size-3.5" />}
          {copyActive ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div
        className={`px-3 py-2 rounded-md bg-foreground text-background text-xs font-medium inline-block transition-all duration-200 ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
        }`}
      >
        {toast ?? '\u00a0'}
      </div>
    </div>
  )
}
