'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV, getCSVFilename } from '@/lib/csv-export'
import type { FoodComputed } from '@/types/food'
import type { ColumnKey } from '@/types/table'

interface ExportCSVProps {
  rows: FoodComputed[]
  visibleColumns: ColumnKey[]
  extraNutrients?: string[]
}

export function ExportCSV({ rows, visibleColumns, extraNutrients = [] }: ExportCSVProps) {
  function handleExport() {
    const blob = exportToCSV(rows, visibleColumns, extraNutrients)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = getCSVFilename()
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="h-8 gap-1.5"
    >
      <Download className="size-3.5" />
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  )
}
