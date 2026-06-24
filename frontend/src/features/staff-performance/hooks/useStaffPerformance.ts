import { useQuery } from '@tanstack/react-query'
import { staffPerformanceApi } from '../api/staffPerformanceApi'
import type { StaffPerformanceFilters } from '../types/staffPerformanceTypes'

export const STAFF_PERFORMANCE_QUERY_KEY = ['staff-performance-report'] as const

export function useStaffPerformanceQuery(filters: StaffPerformanceFilters) {
  return useQuery({
    queryKey: [...STAFF_PERFORMANCE_QUERY_KEY, filters.from_date, filters.to_date, filters.work_type],
    queryFn: () => staffPerformanceApi.getStaffPerformance(filters),
  })
}
