/*
Senior Handover Note:
- Purpose: Render nhom KPI doanh thu cho ADMIN.
- Dependencies: DashboardAdminRevenue type.
- API contract: Nhan du lieu tu admin_revenue trong /dashboard/stats.
- Role access: Chi duoc render khi role ADMIN.
- Maintenance notes: Giu layout gon de doc nhanh tren dashboard.
*/

import { Box, Card, CardContent, Typography } from '@mui/material'
import type { DashboardAdminRevenue } from '../types/dashboard.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
}

export function RevenueSummaryCards({ data }: { data: DashboardAdminRevenue }) {
  const cards = [
    { label: 'Tổng doanh thu', value: formatCurrency(data.total_revenue) },
    { label: 'Doanh thu hôm nay', value: formatCurrency(data.revenue_today) },
    { label: 'Doanh thu tháng này', value: formatCurrency(data.revenue_this_month) },
    { label: 'Đơn hoàn tất', value: String(data.completed_orders) },
    { label: 'Giá trị đơn TB', value: formatCurrency(data.average_order_value) },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
      {cards.map((card) => (
        <Card key={card.label} variant="outlined">
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
              {card.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>
              {card.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
