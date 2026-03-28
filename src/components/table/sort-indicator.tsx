import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface SortIndicatorProps {
  direction: 'asc' | 'desc' | false
}

export function SortIndicator({ direction }: SortIndicatorProps) {
  if (direction === 'asc') {
    return <ChevronUp className="ml-1 inline-block size-3.5 shrink-0" />
  }
  if (direction === 'desc') {
    return <ChevronDown className="ml-1 inline-block size-3.5 shrink-0" />
  }
  return <ChevronsUpDown className="ml-1 inline-block size-3.5 shrink-0 opacity-30" />
}
