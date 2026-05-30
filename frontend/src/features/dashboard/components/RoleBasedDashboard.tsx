/*
Senior Handover Note:
- Purpose: Orchestrate render dashboard theo role.
- Dependencies: AdminRevenueSection/WarehouseOperationsSection/DashboardQuickActions.
- API contract: DashboardStatsResponse.
- Role access: Non-admin khong render revenue section.
- Maintenance notes: Day la diem trung tam role split cua dashboard UI.
*/

import { Alert, Stack } from '@mui/material'
import { AdminRevenueSection } from './AdminRevenueSection'
import { DashboardQuickActions } from './DashboardQuickActions'
import { WarehouseOperationsSection } from './WarehouseOperationsSection'
import type { DashboardStatsResponse } from '../types/dashboard.types'

export function RoleBasedDashboard({ data }: { data: DashboardStatsResponse }) {
  const isAdmin = data.role === 'ADMIN'
  const isViewer = data.role === 'VIEWER'

  return (
    <Stack spacing={2}>
      {/* Senior Handover: dashboard role split */}
      {isAdmin && data.admin_revenue && <AdminRevenueSection data={data.admin_revenue} />}
      <WarehouseOperationsSection data={data.warehouse_operations} />
      {isViewer && <Alert severity="info">Bạn đang ở chế độ read-only (VIEWER).</Alert>}
      <DashboardQuickActions role={data.role} />
    </Stack>
  )
}
