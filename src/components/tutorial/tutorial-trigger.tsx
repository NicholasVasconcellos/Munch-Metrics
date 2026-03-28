'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'tutorial-dismissed'
const PROMPT_DISMISSED_KEY = 'tutorial-prompt-dismissed'

interface TutorialTriggerProps {
  onOpen: () => void
}

export function TutorialTrigger({ onOpen }: TutorialTriggerProps) {
  const [mounted, setMounted] = useState(false)
  const [promptVisible, setPromptVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    const promptDismissed = localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true'
    setPromptVisible(!promptDismissed)
  }, [])

  function handleDismissPrompt(e: React.MouseEvent) {
    e.stopPropagation()
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true')
    setPromptVisible(false)
  }

  function handleOpen() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true')
    setPromptVisible(false)
    onOpen()
  }

  // Don't render until client-side hydration to avoid localStorage mismatch
  if (!mounted) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* First-visit prompt bubble */}
      {promptVisible && (
        <div
          className={cn(
            'relative rounded-lg border border-border bg-popover shadow-lg p-3 pr-8 max-w-[12rem]',
            'animate-in fade-in slide-in-from-bottom-2 duration-300'
          )}
        >
          <p className="text-sm font-medium leading-snug">New here?</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            See how Munch Metrics works in 6 quick steps.
          </p>
          <button
            onClick={handleDismissPrompt}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss tutorial prompt"
          >
            <X className="size-3.5" />
          </button>
          <button
            onClick={handleOpen}
            className="mt-2 text-xs font-medium text-brand hover:underline"
          >
            Show me →
          </button>
        </div>
      )}

      {/* Floating help button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleOpen}
        className="size-10 rounded-full shadow-md"
        aria-label="Open tutorial"
        title="How It Works"
      >
        <HelpCircle className="size-5" />
      </Button>
    </div>
  )
}
