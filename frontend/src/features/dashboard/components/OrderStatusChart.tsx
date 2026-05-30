/*
Senior Handover Note:
- Purpose: Render tong hop trang thai don hang cho admin.
- Dependencies: DashboardOrderStatusSummaryItem type.
- API contract: admin_revenue.order_status_summary.
- Role access: Chi ADMIN.
- Maintenance notes: Dung table de nhe, de thay chart sau neu can.
*/

import { Chip, Paper, Stack, Typography } from '@mui/material'
import type { DashboardOrderStatusSummaryItem } from '../types/dashboard.types'

const colorByStatus: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PICKING: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
}

export function OrderStatusChart({ items }: { items: DashboardOrderStatusSummaryItem[] }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Tỷ lệ trạng thái đơn hàng</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {items.length === 0 && <Typography color="text.secondary">Không có dữ liệu.</Typography>}
        {items.map((item) => (
          <Chip key={item.status} color={colorByStatus[item.status] || 'default'} label={`${item.status}: ${item.count}`} />
        ))}
      </Stack>
    </Paper>
  )
}
