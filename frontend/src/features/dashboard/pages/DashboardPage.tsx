/*
- Mục đích: Page-level container cho dashboard role-based.
- Phụ thuộc: useDashboardQuery + RoleBasedDashboard.
- Hợp đồng API: GET /dashboard/stats.
- Role access: Backend + frontend role split phoi hop de hien thi dung section.
- Ghi chú bảo trì: Loading/error/empty state duoc xu ly tai day.
*/

import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { RoleBasedDashboard } from '../components/RoleBasedDashboard'
import { useDashboardQuery } from '../hooks/useDashboard'
import type { DashboardRevenueFilters } from '../types/dashboard.types'

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createDefaultRevenueFilters(): DashboardRevenueFilters {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
  return {
    revenue_from_date: formatDateInput(from),
    revenue_to_date: formatDateInput(now),
  }
}

export function DashboardPage() {
  const [revenueFilters, setRevenueFilters] = useState<DashboardRevenueFilters>(() => createDefaultRevenueFilters())
  const dashboardQuery = useDashboardQuery(revenueFilters)

  if (dashboardQuery.isLoading) {
    return (
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={220} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    )
  }

  if (dashboardQuery.isError) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1.2}>
          <Alert severity="error">Không tải được dữ liệu dashboard.</Alert>
          <Box>
            <Button variant="contained" onClick={() => dashboardQuery.refetch()}>Thử lại</Button>
          </Box>
        </Stack>
      </Paper>
    )
  }

  if (!dashboardQuery.data) {
    // Ghi chú: Khối xử lý dữ liệu dự phòng.
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Không có dữ liệu dashboard.</Typography>
      </Paper>
    )
  }

  return (
    <RoleBasedDashboard
      data={dashboardQuery.data}
      revenueFilters={revenueFilters}
      isRevenueFetching={dashboardQuery.isFetching}
      onRevenueFiltersChange={setRevenueFilters}
    />
  )
}
