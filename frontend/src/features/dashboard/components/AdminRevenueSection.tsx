/*
- Mục đích: Section tong hop Revenue Analytics cho role ADMIN.
- Phụ thuộc: Cac component con RevenueSummaryCards/RevenueChart/OrderStatusChart/TopFinishedProducts/RecentCompletedOrders.
- Hợp đồng API: Nhan `admin_revenue` tu dashboard stats.
- Role access: Chi ADMIN.
- Ghi chú bảo trì: Neu bo sung bieu do, chen them vao section nay.
*/

import { Stack, Typography } from '@mui/material'
import { OrderStatusChart } from './OrderStatusChart'
import { RecentCompletedOrders } from './RecentCompletedOrders'
import { RevenueChart } from './RevenueChart'
import { RevenueSummaryCards } from './RevenueSummaryCards'
import { TopFinishedProducts } from './TopFinishedProducts'
import type { DashboardAdminRevenue } from '../types/dashboard.types'

export function AdminRevenueSection({ data }: { data: DashboardAdminRevenue }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>Phân tích doanh thu</Typography>
      <RevenueSummaryCards data={data} />
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
        <RevenueChart series={data.revenue_series} />
        <OrderStatusChart items={data.order_status_summary} />
      </Stack>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
        <TopFinishedProducts items={data.top_finished_products} />
        <RecentCompletedOrders items={data.recent_completed_orders} />
      </Stack>
    </Stack>
  )
}
