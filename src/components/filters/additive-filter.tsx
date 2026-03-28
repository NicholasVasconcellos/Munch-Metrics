'use client'

import type { AllergenTag } from '@/types/filters'
import { cn } from '@/lib/utils'

const ALL_ALLERGENS: { key: AllergenTag; label: string }[] = [
  { key: 'milk', label: 'Milk / Dairy' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'fish', label: 'Fish' },
  { key: 'shellfish', label: 'Shellfish' },
  { key: 'tree_nuts', label: 'Tree Nuts' },
  { key: 'peanuts', label: 'Peanuts' },
  { key: 'wheat', label: 'Wheat / Gluten' },
  { key: 'soybeans', label: 'Soy' },
  { key: 'sesame', label: 'Sesame' },
]

interface AdditiveFilterProps {
  selected: AllergenTag[]
  availableAllergens: string[]
  onChange: (selected: AllergenTag[]) => void
}

export function AdditiveFilter({ selected, availableAllergens, onChange }: AdditiveFilterProps) {
  const visible = ALL_ALLERGENS.filter(
    (a) => availableAllergens.length === 0 || availableAllergens.includes(a.key)
  )

  function toggle(key: AllergenTag) {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key]
    onChange(next)
  }

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No allergen data available.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {visible.map(({ key, label }) => {
        const checked = selected.includes(key)
        return (
          <label
            key={key}
            className={cn(
              'flex items-center gap-2 text-sm cursor-pointer rounded-md px-2.5 py-2 border transition-colors',
              checked
                ? 'border-primary/40 bg-primary/5 text-foreground'
                : 'border-border hover:bg-muted'
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(key)}
              className="sr-only"
            />
            <span
              className={cn(
                'size-3.5 rounded border shrink-0 flex items-center justify-center transition-colors',
                checked ? 'border-primary bg-primary' : 'border-muted-foreground/50'
              )}
            >
              {checked && (
                <svg viewBox="0 0 8 8" className="size-2 text-primary-foreground">
                  <path
                    d="M1.5 4l2 2 3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {label}
          </label>
        )
      })}
    </div>
  )
}
