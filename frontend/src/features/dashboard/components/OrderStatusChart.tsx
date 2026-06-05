/*
- Mục đích: Render ECharts donut chart trạng thái vận hành đơn hàng.
- Phụ thuộc: DashboardOrderStatusSummaryItem type, echarts-for-react, helper mapping status.
- Hợp đồng API: Dữ liệu từ dashboard API (`admin_revenue.order_status_summary` hoặc `warehouse_operations.order_status_chart`).
- Quy tắc dữ liệu biểu đồ: Group theo status order và hiển thị count.
- Quy tắc phân quyền: ADMIN và WAREHOUSE được xem chart theo block được cấp.
- Ghi chú bảo trì: Chart data đến từ backend, frontend không tự tổng hợp từ danh sách orders.
*/

import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Box, Paper, Typography } from '@mui/material'
import type { DashboardOrderStatusSummaryItem } from '../types/dashboard.types'
import { mapOrderStatusLabel } from '../utils/dashboardChartUtils'

export function OrderStatusChart({ items, title = 'Trạng thái vận hành kho' }: { items: DashboardOrderStatusSummaryItem[]; title?: string }) {
  const chartData = items.map((item) => ({
    name: mapOrderStatusLabel(item.status),
    value: Number(item.count || 0),
    status: item.status,
  }))
  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0)

  const option: EChartsOption = {
    color: ['#f59e0b', '#0ea5e9', '#16a34a', '#dc2626', '#64748b'],
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderWidth: 0,
      textStyle: { color: '#ffffff' },
      formatter: (params) => {
        const item = params as { name?: string; value?: unknown }
        return `${item.name || ''}<br/>Số lượng: ${Number(item.value || 0).toLocaleString('vi-VN')}`
      },
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#475569' },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: `${totalOrders.toLocaleString('vi-VN')}\nTổng đơn`,
          align: 'center',
          fill: '#0f172a',
          fontSize: 18,
          fontWeight: 800,
          lineHeight: 24,
        },
      },
    ],
    series: [
      {
        name: 'Trạng thái đơn',
        type: 'pie',
        radius: ['56%', '76%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: ({ value }) => Number(value || 0).toLocaleString('vi-VN'),
          color: '#0f172a',
          fontWeight: 700,
        },
        labelLine: { length: 10, length2: 8 },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        data: chartData,
      },
    ],
  }

  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', mb: 1.2 }}>Số lượng đơn theo trạng thái</Typography>
      {totalOrders === 0 ? (
        <Typography color="text.secondary">Chưa có dữ liệu đơn hàng</Typography>
      ) : (
        <Box sx={{ width: '100%', height: { xs: 300, md: 340 } }}>
          <ReactECharts option={option} notMerge lazyUpdate style={{ width: '100%', height: '100%' }} />
        </Box>
      )}
    </Paper>
  )
}
