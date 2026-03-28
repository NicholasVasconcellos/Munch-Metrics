'use client'

import { ChevronDown } from 'lucide-react'
import type { GroupByField } from '@/types/table'

const GROUP_OPTIONS: { value: GroupByField; label: string }[] = [
  { value: null, label: 'No Grouping' },
  { value: 'foodGroup', label: 'Food Group' },
  { value: 'dataSource', label: 'Data Source' },
  { value: 'processingLevel', label: 'Processing Level' },
]

interface GroupSelectorProps {
  groupBy: GroupByField
  onChange: (groupBy: GroupByField) => void
}

export function GroupSelector({ groupBy, onChange }: GroupSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground hidden sm:inline">Group:</span>
      <div className="relative">
        <select
          value={groupBy ?? ''}
          onChange={(e) => {
            const val = e.target.value
            onChange((val === '' ? null : val) as GroupByField)
          }}
          className="h-8 appearance-none rounded border border-input bg-background pl-2.5 pr-7 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
          aria-label="Group by"
        >
          {GROUP_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  )
}
