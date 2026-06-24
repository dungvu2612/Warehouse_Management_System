/*
- Mục đích: Render ECharts line chart doanh thu theo thời gian cho dashboard admin.
- Phụ thuộc: DashboardRevenueSeriesItem type, echarts-for-react, helper format tiền.
- Hợp đồng API: Dữ liệu từ admin_revenue.revenue_series; backend aggregate theo ngày.
- Quy tắc dữ liệu biểu đồ: Chỉ tính doanh thu đơn COMPLETED ở backend.
- Quy tắc phân quyền: Chỉ ADMIN được nhận block admin_revenue.
- Ghi chú bảo trì: Chart data luôn lấy từ dashboard API, không hardcode ở frontend.
*/

import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { DashboardRevenueFilters, DashboardRevenueSeriesItem } from '../types/dashboard.types'
import { formatCurrencyVND } from '../utils/dashboardChartUtils'

type AxisTooltipParam = {
  axisValue?: string
  axisValueLabel?: string
  value?: number | string
}

type RevenueChartProps = {
  series: DashboardRevenueSeriesItem[]
  filters: DashboardRevenueFilters
  isFetching: boolean
  onFiltersChange: (filters: DashboardRevenueFilters) => void
}

const MAX_REVENUE_RANGE_DAYS = 90

function getInclusiveDateRangeDays(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  return Math.floor((to.getTime() - from.getTime()) / 86400000) + 1
}

export function RevenueChart({ series, filters, isFetching, onFiltersChange }: RevenueChartProps) {
  const [draftFilters, setDraftFilters] = useState(filters)
  const [rangeError, setRangeError] = useState('')

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const rangeDays = getInclusiveDateRangeDays(draftFilters.revenue_from_date, draftFilters.revenue_to_date)
    if (rangeDays <= 0) {
      setRangeError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.')
      return
    }
    if (rangeDays > MAX_REVENUE_RANGE_DAYS) {
      setRangeError('Chỉ được lọc tối đa 90 ngày.')
      return
    }
    setRangeError('')
    onFiltersChange(draftFilters)
  }

  const option: EChartsOption = {
    color: ['#2563eb'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderWidth: 0,
      textStyle: { color: '#ffffff' },
      formatter: (params) => {
        const first = Array.isArray(params) ? params[0] as AxisTooltipParam : params as AxisTooltipParam
        return [
          `<strong>${first.axisValueLabel || first.axisValue || ''}</strong>`,
          `Doanh thu: ${formatCurrencyVND(Number(first.value || 0))}`,
        ].join('<br/>')
      },
    },
    grid: {
      left: 10,
      right: 18,
      top: 28,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: series.map((item) => item.date),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: {
        color: '#64748b',
        formatter: (value: string) => value.slice(5),
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        formatter: (value: number) => formatCurrencyVND(value).replace('₫', '').trim(),
      },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    series: [
      {
        name: 'Doanh thu',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#2563eb' },
        itemStyle: { color: '#2563eb', borderColor: '#ffffff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37, 99, 235, 0.28)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
          ]),
        },
        data: series.map((item) => item.revenue),
      },
    ],
  }

  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
      <Stack
        component="form"
        onSubmit={handleSubmit}
        spacing={1}
        sx={{ alignItems: 'stretch', mb: 1.2 }}
      >
        <Box>
          <Typography sx={{ fontWeight: 1000 }}>Doanh thu theo thời gian</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
          <TextField
            label="Từ ngày"
            type="date"
            size="small"
            value={draftFilters.revenue_from_date}
            onChange={(event) => setDraftFilters((current) => ({ ...current, revenue_from_date: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Đến ngày"
            type="date"
            size="small"
            value={draftFilters.revenue_to_date}
            onChange={(event) => setDraftFilters((current) => ({ ...current, revenue_to_date: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button type="submit" variant="contained" disabled={isFetching}>
            {isFetching ? 'Đang lọc' : 'Lọc'}
          </Button>
        </Stack>
        {rangeError && (
          <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
            {rangeError}
          </Typography>
        )}
      </Stack>
      {series.length === 0 ? (
        <Typography color="text.secondary">Không có dữ liệu doanh thu.</Typography>
      ) : (
        <Box sx={{ width: '100%', height: { xs: 300, md: 340 } }}>
          <ReactECharts option={option} notMerge lazyUpdate style={{ width: '100%', height: '100%' }} />
        </Box>
      )}
    </Paper>
  )
}
