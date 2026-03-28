'use client'

import { cn } from '@/lib/utils'

interface TagFilterProps {
  selected: string[]
  availableGroups: string[]
  onChange: (selected: string[]) => void
}

export function TagFilter({ selected, availableGroups, onChange }: TagFilterProps) {
  function toggle(group: string) {
    const next = selected.includes(group)
      ? selected.filter((g) => g !== group)
      : [...selected, group]
    onChange(next)
  }

  if (availableGroups.length === 0) {
    return <p className="text-sm text-muted-foreground">No food groups available.</p>
  }

  return (
    <div className="space-y-0.5 max-h-48 overflow-y-auto">
      {availableGroups.map((group) => {
        const checked = selected.includes(group)
        return (
          <label
            key={group}
            className="flex items-center gap-2.5 text-sm cursor-pointer rounded px-1.5 py-1 hover:bg-muted transition-colors"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(group)}
              className="rounded border-input accent-primary"
            />
            <span className={cn(checked && 'font-medium')}>{group}</span>
          </label>
        )
      })}
    </div>
  )
}
