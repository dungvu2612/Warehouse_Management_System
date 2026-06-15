/*
- Mục đích: Trang tác vụ nhập kho cho nhân viên kho.
- Hợp đồng API: GET/POST /staff/import-receipt-items.
- Quy tắc nghiệp vụ: Staff nhận từng dòng phiếu nhập do ADMIN tạo rồi xác nhận nhập vào khay.
*/

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { staffTasksApi } from '../api/staffTasks.api'
import type { StaffImportTaskItem } from '../types/staffTasks.types'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'

function getApiErrorData(error: unknown): { error_code?: string; error?: string } {
  if (!error || typeof error !== 'object') return {}
  const response = 'response' in error ? error.response : undefined
  if (!response || typeof response !== 'object') return {}
  const data = 'data' in response ? response.data : undefined
  return data && typeof data === 'object' ? data : {}
}

function mapImportTaskError(error: unknown) {
  const { error_code: code, error: message } = getApiErrorData(error)
  if (code === 'IMPORT_TASK_ALREADY_ASSIGNED') return 'Công việc nhập kho đã được nhân viên khác nhận.'
  if (code === 'IMPORT_TASK_NOT_CLAIMED') return 'Bạn cần nhận việc trước khi nhập kho.'
  if (code === 'IMPORT_TASK_NOT_ASSIGNED_TO_YOU') return 'Bạn không phải người phụ trách công việc này.'
  if (code === 'IMPORT_TASK_ALREADY_DONE') return 'Công việc nhập kho đã hoàn thành.'
  if (code === 'IMPORT_QUANTITY_EXCEEDED') return 'Số lượng nhập vượt quá số lượng dự kiến.'
  if (code === 'INVALID_IMPORT_QUANTITY') return 'Số lượng thực nhập không hợp lệ.'
  if (code === 'TRAY_NOT_FOUND') return 'Không tìm thấy khay hoặc khay không thuộc sản phẩm cần nhập.'
  return message || 'Không xử lý được tác vụ nhập kho. Vui lòng thử lại.'
}

const importStatusLabel: Record<string, string> = {
  WAITING: 'Chờ nhận',
  IMPORTING: 'Đang nhập',
  PARTIAL: 'Nhập thiếu',
  DONE: 'Hoàn thành',
}

type ImportTaskFilter = 'ALL' | 'WAITING' | 'MINE'

function ImportTaskCard({
  item,
  onClaim,
  onOpen,
  isClaiming,
}: {
  item: StaffImportTaskItem
  onClaim: (item: StaffImportTaskItem) => void
  onOpen: (item: StaffImportTaskItem) => void
  isClaiming?: boolean
}) {
  const isWaiting = item.status === 'WAITING' || !item.assigned_to
  const progress = item.expected_quantity > 0
    ? Math.min(100, Math.round((item.actual_quantity / item.expected_quantity) * 100))
    : 0

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 900 }} noWrap>
              {item.receipt_code}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }} noWrap>
              {item.supplier_name || 'Chưa có nhà cung cấp'}
            </Typography>
          </Box>
          <Chip
            size="small"
            color={isWaiting ? 'warning' : item.status === 'PARTIAL' ? 'info' : 'secondary'}
            label={importStatusLabel[item.status] || item.status}
            sx={{ fontWeight: 900 }}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ProductImageThumb src={item.product_image_url} alt={item.product_name} size={38} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 14 }} noWrap>
              {item.product_code} - {item.product_name}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Phụ trách: {item.assignee_name || item.assignee_username || 'Chưa có người nhận'}
            </Typography>
          </Box>
        </Stack>

        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
              Đã nhập {item.actual_quantity}/{item.expected_quantity}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {item.actual_tray_code || 'Chưa có khay'}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.75, height: 8, borderRadius: 99 }} />
        </Box>

        <Button
          fullWidth
          variant="contained"
          disabled={isClaiming}
          onClick={() => {
            if (isWaiting) {
              onClaim(item)
              return
            }
            onOpen(item)
          }}
          sx={{ minHeight: 46, fontWeight: 900 }}
        >
          {isWaiting ? 'Nhận việc' : 'Tiếp tục nhập'}
        </Button>
      </Stack>
    </Paper>
  )
}

export function StaffImportTasksPage() {
  const queryClient = useQueryClient()
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; text: string } | null>(null)
  const [activeTask, setActiveTask] = useState<StaffImportTaskItem | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [form, setForm] = useState({ tray_code: '', quantity: 1, note: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ImportTaskFilter>('ALL')

  const importTasksQuery = useQuery({
    queryKey: ['staff-import-tasks'],
    queryFn: staffTasksApi.getImportTasks,
  })

  const openImportTask = (item: StaffImportTaskItem) => {
    setBanner(null)
    setConfirmDialogOpen(false)
    setActiveTask(item)
    setForm({
      tray_code: item.actual_tray_code || '',
      quantity: Math.max(1, item.expected_quantity - item.actual_quantity),
      note: '',
    })
  }

  const closeImportTask = () => {
    setActiveTask(null)
    setConfirmDialogOpen(false)
  }

  const claimImportMutation = useMutation({
    mutationFn: (item: StaffImportTaskItem) => staffTasksApi.claimImportItem(item.id),
    onSuccess: async (_, item) => {
      setBanner({ severity: 'success', text: 'Nhận việc nhập kho thành công.' })
      openImportTask(item)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-import-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] }),
      ])
    },
    onError: async (error) => {
      setBanner({ severity: 'error', text: mapImportTaskError(error) })
      await queryClient.invalidateQueries({ queryKey: ['staff-import-tasks'] })
    },
  })

  const confirmImportMutation = useMutation({
    mutationFn: staffTasksApi.confirmImportItem,
    onSuccess: async (response) => {
      setBanner({ severity: 'success', text: response.message || 'Nhập kho thành công. Tồn kho đã được cập nhật.' })
      setActiveTask(null)
      setConfirmDialogOpen(false)
      setForm({ tray_code: '', quantity: 1, note: '' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-import-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['import-receipts'] }),
      ])
    },
    onError: (error) => setBanner({ severity: 'error', text: mapImportTaskError(error) }),
  })

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return (importTasksQuery.data || []).filter((item) => {
      if (item.status === 'DONE') return false
      if (statusFilter === 'WAITING' && item.assigned_to) return false
      if (statusFilter === 'MINE' && !item.assigned_to) return false
      if (!keyword) return true

      return [
        item.receipt_code,
        item.supplier_name,
        item.product_code,
        item.product_name,
        item.actual_tray_code,
        item.assignee_name,
        item.assignee_username,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    })
  }, [importTasksQuery.data, search, statusFilter])

  const waitingCount = useMemo(() => {
    return (importTasksQuery.data || []).filter((item) => item.status !== 'DONE' && !item.assigned_to).length
  }, [importTasksQuery.data])

  const myTaskCount = useMemo(() => {
    return (importTasksQuery.data || []).filter((item) => item.status !== 'DONE' && item.assigned_to)
      .length
  }, [importTasksQuery.data])

  const waitingTasks = useMemo(() => {
    return filteredTasks.filter((item) => !item.assigned_to)
  }, [filteredTasks])

  const myTasks = useMemo(() => {
    return filteredTasks.filter((item) => item.assigned_to)
  }, [filteredTasks])

  const showWaitingSection = statusFilter === 'ALL' || statusFilter === 'WAITING'
  const showMySection = statusFilter === 'ALL' || statusFilter === 'MINE'

  const filterChips: Array<{ value: ImportTaskFilter; label: string }> = useMemo(() => {
    return [
      { value: 'ALL', label: `Tất cả ${waitingCount + myTaskCount}` },
      { value: 'WAITING', label: `Chờ nhận ${waitingCount}` },
      { value: 'MINE', label: `Việc của tôi ${myTaskCount}` },
    ]
  }, [myTaskCount, waitingCount])

  const handleConfirmImport = () => {
    if (!activeTask) return
    if (!form.tray_code.trim()) {
      setBanner({ severity: 'error', text: 'Vui lòng quét QR khay.' })
      return
    }
    if (form.quantity <= 0) {
      setBanner({ severity: 'error', text: 'Số lượng thực nhập không hợp lệ.' })
      return
    }
    setConfirmDialogOpen(true)
  }

  const submitImportConfirmation = () => {
    if (!activeTask) return
    setConfirmDialogOpen(false)
    confirmImportMutation.mutate({
      itemId: activeTask.id,
      payload: {
        tray_code: form.tray_code.trim(),
        quantity: Number(form.quantity),
        note: form.note.trim(),
      },
    })
  }

  return (
    <PdaLayout title="Tác vụ nhập kho" subtitle="Nhận việc từ phiếu nhập">
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1.2}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Danh sách task nhập kho</Typography>
          <TextField
            size="small"
            fullWidth
            label="Tìm đơn nhập"
            placeholder="Mã phiếu, sản phẩm, nhà cung cấp hoặc khay"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{ htmlInput: { style: { fontSize: 15 } } }}
          />
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {filterChips.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                color={statusFilter === item.value ? 'primary' : 'default'}
                onClick={() => setStatusFilter(item.value)}
                sx={{ minHeight: 36, fontWeight: 800 }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {banner && <Alert severity={banner.severity}>{banner.text}</Alert>}

      {showWaitingSection && (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Đang chờ nhận ({waitingTasks.length})</Typography>
          {importTasksQuery.isLoading && <Alert severity="info">Đang tải công việc nhập kho...</Alert>}
          {importTasksQuery.isError && <Alert severity="error">Không tải được công việc nhập kho.</Alert>}
          {!importTasksQuery.isLoading && !importTasksQuery.isError && waitingTasks.length === 0 && (
            <Alert severity="info">Chưa có công việc nhập kho chờ nhận.</Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 1.2 }}>
            {waitingTasks.map((item) => (
              <ImportTaskCard
                key={item.id}
                item={item}
                onClaim={(task) => claimImportMutation.mutate(task)}
                onOpen={openImportTask}
                isClaiming={claimImportMutation.isPending && claimImportMutation.variables?.id === item.id}
              />
            ))}
          </Box>
        </Stack>
      )}

      {showMySection && (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Việc của tôi ({myTasks.length})</Typography>
          {!importTasksQuery.isLoading && !importTasksQuery.isError && myTasks.length === 0 && (
            <Alert severity="info">Bạn chưa nhận công việc nhập kho nào.</Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 1.2 }}>
            {myTasks.map((item) => (
              <ImportTaskCard
                key={item.id}
                item={item}
                onClaim={(task) => claimImportMutation.mutate(task)}
                onOpen={openImportTask}
              />
            ))}
          </Box>
        </Stack>
      )}

      <Dialog open={Boolean(activeTask)} onClose={closeImportTask} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>Xác nhận nhập kho</DialogTitle>
        <DialogContent>
          {activeTask && (
            <Stack spacing={1.4} sx={{ mt: 0.5 }}>
              <Typography sx={{ fontWeight: 900 }}>{activeTask.receipt_code}</Typography>
              <Typography>
                {activeTask.product_code} - {activeTask.product_name}
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Số lượng dự kiến: {activeTask.expected_quantity} | Đã nhập: {activeTask.actual_quantity}
              </Typography>
              <TextField
                label="Quét QR khay"
                value={form.tray_code}
                onChange={(event) => setForm((prev) => ({ ...prev, tray_code: event.target.value }))}
                autoFocus
                fullWidth
              />
              <TextField
                label="Số lượng thực nhập"
                type="number"
                value={form.quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                fullWidth
              />
              <TextField
                label="Ghi chú"
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />
              <Alert severity="info">
                Hệ thống sẽ cộng số lượng thực nhập vào tồn kho và ghi lịch sử nhập kho.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={closeImportTask}>
            Hủy
          </Button>
          <Button variant="contained" disabled={confirmImportMutation.isPending} onClick={handleConfirmImport}>
            {confirmImportMutation.isPending ? 'Đang nhập...' : 'Xác nhận nhập kho'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>Hoàn tất nhập kho?</DialogTitle>
        <DialogContent>
          {activeTask && (
            <Stack spacing={1.2} sx={{ mt: 0.5 }}>
              <Box>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 900 }}>{activeTask.receipt_code}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                  {activeTask.product_code} - {activeTask.product_name}
                </Typography>
              </Box>
              <Stack
                spacing={0.5}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography sx={{ fontSize: 14 }}>
                  Khay nhập:{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 900 }}>
                    {form.tray_code.trim()}
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: 14 }}>
                  Số lượng thực nhập:{' '}
                  <Box component="span" sx={{ fontWeight: 900 }}>
                    {Number(form.quantity)}
                  </Box>
                </Typography>
              </Stack>
              <Alert severity="warning">
                Sau khi xác nhận, hệ thống sẽ cộng tồn kho và ghi lịch sử nhập kho.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setConfirmDialogOpen(false)}>
            Kiểm tra lại
          </Button>
          <Button variant="contained" disabled={confirmImportMutation.isPending} onClick={submitImportConfirmation}>
            {confirmImportMutation.isPending ? 'Đang nhập...' : 'Đồng ý nhập kho'}
          </Button>
        </DialogActions>
      </Dialog>
    </PdaLayout>
  )
}
