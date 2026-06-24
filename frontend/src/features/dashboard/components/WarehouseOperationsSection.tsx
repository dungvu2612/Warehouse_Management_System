/*
- Mục đích: Section tong hop Warehouse Operations cho moi role.
- Phụ thuộc: WarehouseSummaryCards/WarehouseAlerts/PickingMonitor/RecentWarehouseActivities/RecentOrders.
- Hợp đồng API: Nhan warehouse_operations tu dashboard stats.
- Role access: ADMIN/WAREHOUSE.
- Ghi chú bảo trì: Khong dat action write trong section nay.
*/

import { Stack, Typography } from '@mui/material'
import { PickingMonitor } from './PickingMonitor'
import { RecentOrders } from './RecentOrders'
import { RecentWarehouseActivities } from './RecentWarehouseActivities'
import { WarehouseAlerts } from './WarehouseAlerts'
import { WarehouseSummaryCards } from './WarehouseSummaryCards'
import type { DashboardWarehouseOperations } from '../types/dashboard.types'

export function WarehouseOperationsSection({ data }: { data: DashboardWarehouseOperations }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>Vận hành kho</Typography>
      <WarehouseSummaryCards data={data} />
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
        <WarehouseAlerts alerts={data.warehouse_alerts} />
        <PickingMonitor monitor={data.picking_monitor} />
      </Stack>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
        <RecentWarehouseActivities items={data.recent_activities} />
        <RecentOrders items={data.recent_orders} />
      </Stack>
    </Stack>
  )
}
