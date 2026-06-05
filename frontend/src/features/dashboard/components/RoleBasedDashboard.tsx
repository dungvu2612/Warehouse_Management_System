/* Render dashboard theo role. */

import { Stack } from '@mui/material'
import { AdminRevenueSection } from './AdminRevenueSection'
import { DashboardQuickActions } from './DashboardQuickActions'
import { WarehouseOperationsSection } from './WarehouseOperationsSection'
import type { DashboardStatsResponse } from '../types/dashboard.types'

export function RoleBasedDashboard({ data }: { data: DashboardStatsResponse }) {
  const isAdmin = data.role === 'ADMIN'

  return (
    <Stack spacing={2}>
      {isAdmin && data.admin_revenue && <AdminRevenueSection data={data.admin_revenue} />}
      <WarehouseOperationsSection data={data.warehouse_operations} />
      <DashboardQuickActions role={data.role} />
    </Stack>
  )
}
