/*
- Mục đích: React Query hook cho dashboard role-based.
- Phụ thuộc: dashboardApi.
- Hợp đồng API: Query GET /dashboard/stats.
- Role access: Hook khong tu filter role, vi backend da role-aware.
- Ghi chú bảo trì: Neu tach endpoint admin, them hook moi tai module nay.
*/

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
import type { DashboardRevenueFilters } from '../types/dashboard.types'

const DASHBOARD_QUERY_KEY = ['dashboard-stats'] as const

export function useDashboardQuery(filters: DashboardRevenueFilters) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getDashboardStats(filters),
  })
}
