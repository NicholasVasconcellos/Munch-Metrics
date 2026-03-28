'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TableConfig } from '@/types/table'
import { serializeTableState, deserializeTableState } from '@/lib/url-state'

export function useUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tableConfig = useMemo(
    () => deserializeTableState(searchParams),
    [searchParams]
  )

  const setTableConfig = useCallback(
    (updater: TableConfig | ((prev: TableConfig) => TableConfig)) => {
      const current = deserializeTableState(searchParams)
      const next = typeof updater === 'function' ? updater(current) : updater
      const params = serializeTableState(next)
      const query = params.toString()
      const url = query ? `${pathname}?${query}` : pathname
      router.replace(url, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return { tableConfig, setTableConfig }
}
