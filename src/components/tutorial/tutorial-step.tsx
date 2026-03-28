'use client'

import type { ReactNode } from 'react'

interface TutorialStepProps {
  title: string
  description: string
  animation: ReactNode
}

export function TutorialStep({ title, description, animation }: TutorialStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="rounded-lg bg-muted/30 border border-border overflow-hidden min-h-[160px] flex items-center justify-center p-5">
        {animation}
      </div>
    </div>
  )
}
