'use client'

import { useState, useEffect } from 'react'
import { searchFoods } from '@/lib/queries/search-foods'
import type { FoodComputed } from '@/types/food'
import type { TableConfig, TableQueryResult } from '@/types/table'

interface UseFoodQueryResult {
  data: TableQueryResult<FoodComputed> | null
  isLoading: boolean
  error: string | null
}

export function useFoodQuery(config: TableConfig): UseFoodQueryResult {
  const [data, setData] = useState<TableQueryResult<FoodComputed> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Serialize config to a stable key for effect dependencies
  const configKey = JSON.stringify({
    filters: config.filters,
    sort: config.sort,
    groupBy: config.groupBy,
    page: config.pagination.page,
    pageSize: config.pagination.pageSize,
  })

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    searchFoods({
      filters: config.filters,
      sort: config.sort,
      groupBy: config.groupBy,
      page: config.pagination.page,
      pageSize: config.pagination.pageSize,
    })
      .then((result) => {
        if (!cancelled) {
          setData(result)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])

  return { data, isLoading, error }
}
