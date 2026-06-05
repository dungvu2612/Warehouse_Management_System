/*
- Mục đích: Card KPI doanh thu có số rút gọn và so sánh kỳ trước.
- Phụ thuộc: DashboardTrendMetric type, MUI card, helper formatCompactVND.
- Hợp đồng API: Ưu tiên dùng admin_revenue.revenue_summary, có fallback field cũ.
- Ghi chú bảo trì: Không tính số liệu dashboard tại frontend, chỉ format và render dữ liệu backend.
*/

import { Card, CardContent, Stack, Typography } from '@mui/material'
import { RemoveOutlined, TrendingDownOutlined, TrendingUpOutlined } from '@mui/icons-material'
import type { DashboardTrendMetric } from '../types/dashboard.types'
import { formatCompactVND } from '../utils/dashboardChartUtils'

type RevenueMetricCardProps = {
  title: string
  metric: DashboardTrendMetric
  valueType: 'money' | 'number'
  description?: string
}

function formatMetricValue(value: number, valueType: RevenueMetricCardProps['valueType']): string {
  if (valueType === 'money') return formatCompactVND(value)
  return Number(value || 0).toLocaleString('vi-VN')
}

function formatPercent(value: number): string {
  const rounded = Math.round(Number(value || 0) * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return rounded > 0 ? `+${text}%` : `${text}%`
}

function getTrendView(metric: DashboardTrendMetric) {
  if (metric.trend === 'UP') {
    return {
      icon: <TrendingUpOutlined fontSize="small" />,
      color: '#16a34a',
      bgColor: 'rgba(22, 163, 74, 0.1)',
      text: `${formatPercent(metric.change_percent)} so với kỳ trước`,
    }
  }

  if (metric.trend === 'DOWN') {
    return {
      icon: <TrendingDownOutlined fontSize="small" />,
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      text: `${formatPercent(metric.change_percent)} so với kỳ trước`,
    }
  }

  return {
    icon: <RemoveOutlined fontSize="small" />,
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.12)',
    text: 'Không đổi so với kỳ trước',
  }
}

export function RevenueMetricCard({ title, metric, valueType, description }: RevenueMetricCardProps) {
  const trend = getTrendView(metric)

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 1.6, '&:last-child': { pb: 1.6 } }}>
        <Stack spacing={0.9}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: { xs: 22, md: 24 }, lineHeight: 1.05, fontWeight: 950 }}>
            {formatMetricValue(metric.value, valueType)}
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: 'center',
              alignSelf: 'flex-start',
              px: 0.8,
              py: 0.45,
              borderRadius: 999,
              color: trend.color,
              bgcolor: trend.bgColor,
              maxWidth: '100%',
            }}
          >
            {trend.icon}
            <Typography sx={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
              {trend.text}
            </Typography>
          </Stack>
          {description && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {description}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
