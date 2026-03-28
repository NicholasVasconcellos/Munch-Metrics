'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TutorialStep } from './tutorial-step'

const SearchAnim = dynamic(() =>
  import('./animations/search-anim').then((m) => ({ default: m.SearchAnim }))
)
const FilterAnim = dynamic(() =>
  import('./animations/filter-anim').then((m) => ({ default: m.FilterAnim }))
)
const SortAnim = dynamic(() =>
  import('./animations/sort-anim').then((m) => ({ default: m.SortAnim }))
)
const GroupAnim = dynamic(() =>
  import('./animations/group-anim').then((m) => ({ default: m.GroupAnim }))
)
const ColumnsAnim = dynamic(() =>
  import('./animations/columns-anim').then((m) => ({ default: m.ColumnsAnim }))
)
const ExportAnim = dynamic(() =>
  import('./animations/export-anim').then((m) => ({ default: m.ExportAnim }))
)

interface StepConfig {
  title: string
  description: string
  animation: React.ReactNode
}

function buildSteps(): StepConfig[] {
  return [
    {
      title: 'Search Any Food',
      description:
        'Type any food name to instantly search 8,000+ items. Autocomplete suggestions appear as you type.',
      animation: <SearchAnim />,
    },
    {
      title: 'Filter by Dietary Needs',
      description:
        'Apply dietary filters like Vegan or High Protein, exclude allergens, and narrow by food group.',
      animation: <FilterAnim />,
    },
    {
      title: 'Sort by Any Nutrient',
      description:
        'Click any column header to sort by that nutrient. Click again to reverse the order.',
      animation: <SortAnim />,
    },
    {
      title: 'Group Foods Together',
      description:
        'Group results by Food Group, Data Source, or Processing Level to compare categories at a glance.',
      animation: <GroupAnim />,
    },
    {
      title: 'Choose Your Columns',
      description:
        'Show only the nutrients you care about. Toggle columns on and off with the column picker.',
      animation: <ColumnsAnim />,
    },
    {
      title: 'Export & Share',
      description:
        'Download your filtered results as a CSV, or copy a link to share your exact view with anyone.',
      animation: <ExportAnim />,
    },
  ]
}

interface TutorialModalProps {
  open: boolean
  onClose: () => void
}

export function TutorialModal({ open, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const steps = React.useMemo(() => buildSteps(), [])

  // Reset to first step on open
  React.useEffect(() => {
    if (open) setCurrentStep(0)
  }, [open])

  function handlePrev() {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      onClose()
    }
  }

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md gap-5">
        <DialogTitle className="sr-only">How It Works — Tutorial</DialogTitle>

        <TutorialStep
          title={step.title}
          description={step.description}
          animation={step.animation}
        />

        {/* Step dot indicators */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === currentStep
                  ? 'size-2.5 bg-brand'
                  : 'size-2 bg-muted-foreground/25 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                Previous
              </Button>
            )}
            <Button variant="brand" size="sm" onClick={handleNext}>
              {isLast ? 'Got it' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
