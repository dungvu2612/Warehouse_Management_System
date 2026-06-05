/*
- Mục đích: Render nhom KPI doanh thu cho ADMIN.
- Phụ thuộc: DashboardAdminRevenue type.
- Hợp đồng API: Nhan du lieu tu admin_revenue trong /dashboard/stats.
- Role access: Chi duoc render khi role ADMIN.
- Ghi chú bảo trì: Giu layout gon de doc nhanh tren dashboard.
*/

import { Box } from '@mui/material'
import { RevenueMetricCard } from './RevenueMetricCard'
import type { DashboardAdminRevenue, DashboardRevenueSummary, DashboardTrendMetric } from '../types/dashboard.types'

function createMetric(value: number): DashboardTrendMetric {
  return {
    value,
    previous_value: value,
    change_percent: 0,
    trend: 'NEUTRAL',
  }
}

function getRevenueSummary(data: DashboardAdminRevenue): DashboardRevenueSummary {
  return data.revenue_summary || {
    total_revenue: createMetric(data.total_revenue),
    today_revenue: createMetric(data.revenue_today),
    month_revenue: createMetric(data.revenue_this_month),
    completed_orders: createMetric(data.completed_orders),
    average_order_value: createMetric(data.average_order_value),
  }
}

export function RevenueSummaryCards({ data }: { data: DashboardAdminRevenue }) {
  const summary = getRevenueSummary(data)
  const cards = [
    { label: 'Tổng doanh thu', metric: summary.total_revenue, valueType: 'money' as const },
    { label: 'Doanh thu hôm nay', metric: summary.today_revenue, valueType: 'money' as const },
    { label: 'Doanh thu tháng này', metric: summary.month_revenue, valueType: 'money' as const },
    { label: 'Đơn hoàn tất', metric: summary.completed_orders, valueType: 'number' as const },
    { label: 'Giá trị đơn TB', metric: summary.average_order_value, valueType: 'money' as const },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
      {cards.map((card) => (
        <RevenueMetricCard key={card.label} title={card.label} metric={card.metric} valueType={card.valueType} />
      ))}
    </Box>
  )
}
