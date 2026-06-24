/* Render dashboard theo role. */

import { Stack } from '@mui/material'
import { AdminRevenueSection } from './AdminRevenueSection'
import { WarehouseOperationsSection } from './WarehouseOperationsSection'
import type { DashboardRevenueFilters, DashboardStatsResponse } from '../types/dashboard.types'

type RoleBasedDashboardProps = {
  data: DashboardStatsResponse
  revenueFilters: DashboardRevenueFilters
  isRevenueFetching: boolean
  onRevenueFiltersChange: (filters: DashboardRevenueFilters) => void
}

export function RoleBasedDashboard({
  data,
  revenueFilters,
  isRevenueFetching,
  onRevenueFiltersChange,
}: RoleBasedDashboardProps) {
  const isAdmin = data.role === 'ADMIN'

  return (
    <Stack spacing={2}>
      {isAdmin && data.admin_revenue && (
        <AdminRevenueSection
          data={data.admin_revenue}
          filters={revenueFilters}
          isFetching={isRevenueFetching}
          onFiltersChange={onRevenueFiltersChange}
        />
      )}
      <WarehouseOperationsSection data={data.warehouse_operations} />
    </Stack>
  )
}
