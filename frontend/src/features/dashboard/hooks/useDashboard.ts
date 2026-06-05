/*
- Mục đích: React Query hook cho dashboard role-based.
- Phụ thuộc: dashboardApi.
- Hợp đồng API: Query GET /dashboard/stats.
- Role access: Hook khong tu filter role, vi backend da role-aware.
- Ghi chú bảo trì: Neu tach endpoint admin, them hook moi tai module nay.
*/

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'

const DASHBOARD_QUERY_KEY = ['dashboard-stats'] as const

export function useDashboardQuery() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: dashboardApi.getDashboardStats,
  })
}
