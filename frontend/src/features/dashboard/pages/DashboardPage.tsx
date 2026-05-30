/*
Senior Handover Note:
- Purpose: Page-level container cho dashboard role-based.
- Dependencies: useDashboardQuery + RoleBasedDashboard.
- API contract: GET /dashboard/stats.
- Role access: Backend + frontend role split phoi hop de hien thi dung section.
- Maintenance notes: Loading/error/empty state duoc xu ly tai day.
*/

import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { RoleBasedDashboard } from '../components/RoleBasedDashboard'
import { useDashboardQuery } from '../hooks/useDashboard'

export function DashboardPage() {
  const dashboardQuery = useDashboardQuery()

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
    // Senior Handover: fallback handling block.
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Không có dữ liệu dashboard.</Typography>
      </Paper>
    )
  }

  return <RoleBasedDashboard data={dashboardQuery.data} />
}
