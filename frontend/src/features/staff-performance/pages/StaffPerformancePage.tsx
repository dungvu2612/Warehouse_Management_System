import { useMemo, useState } from 'react'
import { AssessmentOutlined, FilterAltOutlined, Refresh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useStaffPerformanceQuery } from '../hooks/useStaffPerformance'
import type { StaffPerformanceFilters, StaffPerformanceWorkType } from '../types/staffPerformanceTypes'
import { mapStaffPerformanceApiError } from '../utils/staffPerformanceError'

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createDefaultFilters(): StaffPerformanceFilters {
  const now = new Date()
  return {
    from_date: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    to_date: formatDateInput(now),
    work_type: 'all',
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function StaffPerformancePage() {
  const [draftFilters, setDraftFilters] = useState<StaffPerformanceFilters>(() => createDefaultFilters())
  const [appliedFilters, setAppliedFilters] = useState<StaffPerformanceFilters>(() => createDefaultFilters())
  const reportQuery = useStaffPerformanceQuery(appliedFilters)

  const items = useMemo(
    () => [...(reportQuery.data?.items || [])].sort((a, b) => b.performance_score - a.performance_score),
    [reportQuery.data?.items],
  )

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        taskCount: acc.taskCount + item.total_task_count,
        quantity: acc.quantity + item.total_quantity,
        weightedQuantity: acc.weightedQuantity + item.weighted_total_quantity,
      }),
      { taskCount: 0, quantity: 0, weightedQuantity: 0 },
    )
  }, [items])

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' } }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <AssessmentOutlined color="secondary" />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Hiệu suất nhân viên</Typography>
            </Stack>
            <Typography color="text.secondary">
              Báo cáo tham chiếu cho ADMIN, không tính lương trực tiếp trong hệ thống
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip color="secondary" label={`Nhân viên: ${items.length}`} sx={{ fontWeight: 800 }} />
            <Chip label={`Tổng task: ${formatNumber(totals.taskCount)}`} sx={{ fontWeight: 800 }} />
            <Chip label={`Tổng số lượng: ${formatNumber(totals.quantity)}`} sx={{ fontWeight: 800 }} />
            <Chip label={`Quy đổi: ${formatDecimal(totals.weightedQuantity)}`} sx={{ fontWeight: 800 }} />
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            label="Từ ngày"
            type="date"
            value={draftFilters.from_date}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, from_date: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Đến ngày"
            type="date"
            value={draftFilters.to_date}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, to_date: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Loại công việc"
            value={draftFilters.work_type}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, work_type: event.target.value as StaffPerformanceWorkType }))}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="picking">Nhặt hàng</MenuItem>
            <MenuItem value="import">Nhập kho</MenuItem>
          </TextField>
          <Button variant="contained" startIcon={<FilterAltOutlined />} onClick={applyFilters}>
            Lọc
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => reportQuery.refetch()}>
            Làm mới
          </Button>
        </Stack>
      </Paper>

      {reportQuery.isError && <Alert severity="error">{mapStaffPerformanceApiError(reportQuery.error)}</Alert>}

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nhân viên</TableCell>
                <TableCell align="left">Task nhặt hàng</TableCell>
                <TableCell align="left">Số lượng đã nhặt</TableCell>
                <TableCell align="left">Task nhập kho</TableCell>
                <TableCell align="left">Số lượng đã nhập</TableCell>
                <TableCell align="left">Tổng task</TableCell>
                <TableCell align="left">Tổng số lượng</TableCell>
                <TableCell align="left">Khối lượng quy đổi</TableCell>
                <TableCell align="left">Điểm hiệu suất</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportQuery.isLoading && Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 9 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton height={24} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!reportQuery.isLoading && !reportQuery.isError && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">Không có dữ liệu hiệu suất trong khoảng thời gian đã chọn</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!reportQuery.isLoading && !reportQuery.isError && items.map((item) => (
                <TableRow key={item.staff_id} hover>
                  <TableCell sx={{ fontWeight: 800 }}>{item.staff_name}</TableCell>
                  <TableCell align="left">{formatNumber(item.picking_task_count)}</TableCell>
                  <TableCell align="left">{formatNumber(item.picked_quantity)}</TableCell>
                  <TableCell align="left">{formatNumber(item.import_task_count)}</TableCell>
                  <TableCell align="left">{formatNumber(item.imported_quantity)}</TableCell>
                  <TableCell align="left">{formatNumber(item.total_task_count)}</TableCell>
                  <TableCell align="left">{formatNumber(item.total_quantity)}</TableCell>
                  <TableCell align="left">{formatDecimal(item.weighted_total_quantity)}</TableCell>
                  <TableCell align="left">
                    <Chip color="secondary" label={formatNumber(item.performance_score)} sx={{ fontWeight: 900 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}
