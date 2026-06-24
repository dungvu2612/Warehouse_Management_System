/*
- Mục đích: Staff picking detail mobile layout cho HT730.
- Phụ thuộc: Order detail query, PDA scan mutations, centralized scanner, PdaLayout, PickingItemCard, scan panels.
- Hợp đồng API: GET /orders/:id, POST /orders/picking-tasks/:id/verify-tray, POST /orders/picking-tasks/:id/scan-product.
- Hành vi máy quét HT730: TagAccess Keyboard nhập QR vào một input ẩn đang focus và gửi Enter.
- Hợp đồng callback API: TRAY xác minh khay của task đã chọn; PRODUCT quét một đơn vị sản phẩm.
- Ghi chú bảo trì: Desktop order print is separate from PDA picking layout.
*/

import { useEffect, useMemo, useState } from 'react'
import { ArrowBack, QrCode2 } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../app/providers/useAuth'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { useScannerInput } from '../../scanner/hooks/useScannerInput'
import { ScannerHiddenInput } from '../../scanner/components/ScannerHiddenInput'
import { ScanResultPanel } from '../../pda/components/ScanResultPanel'
import { useOrderByIdQuery } from '../../orders/hooks/useOrders'
import type { OrderDetailPickingTask } from '../../orders/types/orderTypes'
import { mapOrderApiError } from '../../orders/utils/orderError'
import { usePDAScanProductMutation, usePDAVerifyTrayMutation } from '../hooks/usePdaPicking'
import { PickingItemCard } from '../components/PickingItemCard'
import { ListPagination } from '../../../shared/components/ListPagination'
import { getApiErrorInfo } from '../../../shared/lib/apiError'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'
import { formatDateTimeVN } from '../../../shared/lib/datetime'
import { staffTasksApi } from '../../staff-tasks/api/staffTasks.api'

export function StaffPickingDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const numericOrderId = Number(orderId)
  const detailQuery = useOrderByIdQuery(Number.isFinite(numericOrderId) ? numericOrderId : null)
  const verifyTrayMutation = usePDAVerifyTrayMutation()
  const scanProductMutation = usePDAScanProductMutation()

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [verifiedTrayCode, setVerifiedTrayCode] = useState('')
  const [productFeedback, setProductFeedback] = useState<{ severity: 'success' | 'error' | 'info' | 'warning'; title: string; message: string } | null>(null)
  const [taskPage, setTaskPage] = useState(1)
  const [claimMessage, setClaimMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null)

  const detail = detailQuery.data
  const tasks = useMemo(() => detail?.picking_tasks || [], [detail?.picking_tasks])
  const firstAssignedTask = tasks.find((task) => task.assigned_to)
  const assignedTo = firstAssignedTask?.assigned_to || null
  const assigneeLabel = firstAssignedTask?.assignee_name || firstAssignedTask?.assignee_username || ''
  const isOrderCompleted = detail?.order.status === 'COMPLETED'
  const isAssignedToMe = Boolean(assignedTo && user?.id && assignedTo === user.id)
  const canPick = Boolean(!isOrderCompleted && assignedTo && isAssignedToMe)
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null
  const openTasks = tasks.filter((task) => task.status !== 'DONE')
  const paginatedTasks = useMemo(() => {
    return paginateItems(tasks, taskPage, DEFAULT_PAGE_SIZE)
  }, [tasks, taskPage])

  const claimMutation = useMutation({
    mutationFn: staffTasksApi.claimOrder,
    onSuccess: async () => {
      setClaimMessage({ severity: 'success', text: 'Nhận việc thành công.' })
      await Promise.all([
        detailQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['staff-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] }),
      ])
    },
    onError: (error: unknown) => {
      setClaimMessage({ severity: 'error', text: getApiErrorInfo(error).message || 'Không thể nhận việc. Vui lòng thử lại.' })
      void detailQuery.refetch()
    },
  })

  useEffect(() => {
    if (selectedTaskId || tasks.length === 0) return
    const firstOpenTask = tasks.find((task) => task.status !== 'DONE')
    if (firstOpenTask) setSelectedTaskId(firstOpenTask.id)
  }, [selectedTaskId, tasks])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setTaskPage(1)
  }, [numericOrderId])

  const progressLabel = useMemo(() => {
    if (!detail) return '0/0'
    return `${detail.progress.done_tasks}/${detail.progress.total_tasks}`
  }, [detail])

  const statusLabel = useMemo(() => {
    const status = detail?.order.status || ''
    const labels: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      PICKING: 'Đang nhặt',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    }
    return labels[status] || status || '-'
  }, [detail?.order.status])

  const selectTask = (task: OrderDetailPickingTask) => {
    setSelectedTaskId(task.id)
    setVerifiedTrayCode('')
    setProductFeedback(null)
  }

  const moveToNextTask = (currentTaskId: number) => {
    const nextTask = tasks.find((task) => task.id !== currentTaskId && task.status !== 'DONE')
    if (nextTask) {
      const nextTaskIndex = tasks.findIndex((task) => task.id === nextTask.id)
      if (nextTaskIndex >= 0) setTaskPage(Math.floor(nextTaskIndex / DEFAULT_PAGE_SIZE) + 1)
      setSelectedTaskId(nextTask.id)
      setVerifiedTrayCode('')
      setProductFeedback({ severity: 'info', title: 'Chuyển item tiếp theo', message: nextTask.product_code })
    } else {
      setSelectedTaskId(null)
      setVerifiedTrayCode('')
      setProductFeedback({ severity: 'success', title: 'Hoàn thành', message: 'Tất cả item đã DONE' })
    }
  }

  const handleVerifyTray = async (value: string) => {
    if (!selectedTask) throw new Error('Chưa chọn item')
    const trayDisplayName = selectedTask.tray_code || '-'
    try {
      await verifyTrayMutation.mutateAsync({ taskId: selectedTask.id, tray_qr_code: value })
      setVerifiedTrayCode(value)
      setProductFeedback({
        severity: 'success',
        title: 'Đúng khay',
        message: `Mã khay: ${value} · Tên khay: ${trayDisplayName}`,
      })
      void detailQuery.refetch()
    } catch (error) {
      setVerifiedTrayCode('')
      setProductFeedback({
        severity: 'error',
        title: 'Sai khay',
        message: `Cần: ${selectedTask.tray_code || '-'} | Đã quét: ${value} | ${mapOrderApiError(error)}`,
      })
      throw error
    }
  }

  const handleScanProduct = async (value: string) => {
    if (!selectedTask || !verifiedTrayCode) throw new Error('Cần verify tray trước khi scan product')
    const productDisplayName = selectedTask.product_name || '-'
    try {
      const result = await scanProductMutation.mutateAsync({
        taskId: selectedTask.id,
        tray_qr_code: verifiedTrayCode,
        product_qr_code: value,
      })
      setProductFeedback({
        severity: 'success',
        title: '+1 sản phẩm',
        message: `Mã SP: ${value} · Tên SP: ${productDisplayName} · Còn lại ${result.remaining_quantity}`,
      })
      await detailQuery.refetch()
      if (result.remaining_quantity <= 0) {
        moveToNextTask(selectedTask.id)
      }
    } catch (error) {
      setProductFeedback({ severity: 'error', title: 'Sai sản phẩm', message: mapOrderApiError(error) })
      throw error
    }
  }

  const scanner = useScannerInput({
    autoStart: true,
    initialMode: 'TRAY',
    // Ghi chú: Máy quét HT730 hoạt động như keyboard wedge, nên trang này luôn focus input ẩn.
    // Ghi chú: Chế độ quét tự động bỏ nhu cầu bấm Scan QR trước mỗi lần quét.
    // Ghi chú: Loại mã quét được suy ra từ trạng thái picking hiện tại, không phụ thuộc nút thủ công.
    // Ghi chú: Tập trung logic quét tại đây để tránh lặp handler.
    onScanComplete: async ({ code }) => {
      if (!canPick) return
      if (!selectedTask) return
      if (!verifiedTrayCode) {
        await handleVerifyTray(code)
        return
      }
      await handleScanProduct(code)
    },
  })
  const { resumeScanner, pauseScanner } = scanner

  const isBusy = verifyTrayMutation.isPending || scanProductMutation.isPending || detailQuery.isFetching
  const currentScanStep = useMemo(() => {
    if (!canPick) return 'BLOCKED'
    if (isBusy) return 'PROCESSING_SCAN'
    if (openTasks.length === 0) return 'COMPLETED'
    if (!selectedTask) return 'READY_TO_SCAN_TRAY'
    if (!verifiedTrayCode) return 'READY_TO_SCAN_TRAY'
    return 'READY_TO_SCAN_PRODUCT'
  }, [canPick, isBusy, openTasks.length, selectedTask, verifiedTrayCode])

  useEffect(() => {
    if (currentScanStep === 'READY_TO_SCAN_TRAY') {
      resumeScanner('TRAY')
      return
    }
    if (currentScanStep === 'READY_TO_SCAN_PRODUCT') {
      resumeScanner('PRODUCT')
      return
    }
    pauseScanner()
  }, [currentScanStep, pauseScanner, resumeScanner])

  if (!Number.isFinite(numericOrderId) || numericOrderId <= 0) {
    return <Alert severity="error">Order ID không hợp lệ.</Alert>
  }

  return (
    <PdaLayout
      title="Chi tiết đơn"
      subtitle={detail?.order.order_code || `Tiến độ ${progressLabel}`}
    >
      {detailQuery.isLoading && <Alert severity="info">Đang tải đơn...</Alert>}
      {detailQuery.isError && <Alert severity="error">Không tải được chi tiết đơn.</Alert>}

      {detail && (
        <>
          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Button
                type="button"
                variant="text"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/staff/tasks')}
                sx={{ alignSelf: 'flex-start', px: 0, fontWeight: 800 }}
              >
                Quay lại tác vụ
              </Button>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: 19, fontWeight: 900 }} noWrap>
                    {detail.order.order_code}
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>
                    {formatDateTimeVN(detail.order.created_at)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <QrCode2 sx={{ color: 'text.secondary' }} />
                  <Chip label={statusLabel} color="secondary" sx={{ fontWeight: 900 }} />
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                <Chip size="small" label={`Tiến độ ${progressLabel}`} sx={{ fontWeight: 800 }} />
                <Chip size="small" label={`${detail.progress.percent.toFixed(0)}%`} sx={{ fontWeight: 800 }} />
                <Chip size="small" label={`Còn ${openTasks.length} task`} sx={{ fontWeight: 800 }} />
              </Stack>
            </Stack>
          </Paper>

          {claimMessage && <Alert severity={claimMessage.severity}>{claimMessage.text}</Alert>}
          {isOrderCompleted && <Alert severity="success">Công việc đã hoàn thành.</Alert>}
          {!isOrderCompleted && !assignedTo && (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => claimMutation.mutate(numericOrderId)}
                  disabled={claimMutation.isPending}
                >
                  Nhận việc
                </Button>
              }
            >
              Bạn cần nhận việc trước khi nhặt hàng.
            </Alert>
          )}
          {!isOrderCompleted && assignedTo && !isAssignedToMe && (
            <Alert severity="warning">Công việc này đang được nhân viên khác xử lý: {assigneeLabel || `#${assignedTo}`}.</Alert>
          )}

          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={0.75}>
              <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Khách hàng</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{detail.order.customer_name || '-'}</Typography>
              <Typography sx={{ fontSize: 15 }}>SĐT: {detail.order.customer_phone || '-'}</Typography>
              <Typography sx={{ fontSize: 15, overflowWrap: 'anywhere' }}>
                Địa chỉ: {detail.order.customer_address || '-'}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 900 }}>
                {currentScanStep === 'BLOCKED' && 'Chưa thể quét'}
                {currentScanStep === 'READY_TO_SCAN_TRAY' && 'Sẵn sàng quét mã khay'}
                {currentScanStep === 'READY_TO_SCAN_PRODUCT' && 'Sẵn sàng quét mã sản phẩm'}
                {currentScanStep === 'PROCESSING_SCAN' && 'Đang xử lý mã...'}
                {currentScanStep === 'COMPLETED' && 'Đơn đã hoàn thành'}
              </Typography>
              {selectedTask && (
                <Typography sx={{ color: 'text.secondary' }}>
                  Task hiện tại: {selectedTask.product_code || '-'} · Khay cần: {selectedTask.tray_code || '-'} · Phụ trách: {selectedTask.assignee_name || selectedTask.assignee_username || 'Chưa có người thực hiện'}
                </Typography>
              )}
              <Stack direction="row" spacing={1}>
            
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setVerifiedTrayCode('')
                    scanner.resumeScanner('TRAY')
                  }}
                  disabled={!selectedTask || !canPick}
                >
                  Quét lại khay
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {productFeedback && (
            <ScanResultPanel severity={productFeedback.severity} title={productFeedback.title} message={productFeedback.message} />
          )}

          <Stack spacing={1.2}>
            {paginatedTasks.map((task) => (
              <Stack key={task.id} spacing={1}>
                <PickingItemCard task={task} active={task.id === selectedTaskId} onSelect={() => selectTask(task)} />
              </Stack>
            ))}
            <ListPagination
              currentPage={taskPage}
              totalItems={tasks.length}
              trangSize={DEFAULT_PAGE_SIZE}
              onPageChange={(trang) => {
                setTaskPage(trang)
                setSelectedTaskId(null)
                setVerifiedTrayCode('')
                setProductFeedback(null)
              }}
            />
          </Stack>
        </>
      )}

      <Box>
        <ScannerHiddenInput
          inputRef={scanner.scannerInputRef}
          value={scanner.scanValue}
          onChange={scanner.handleScannerChange}
          onKeyDown={(event) => void scanner.handleScannerKeyDown(event)}
        />
      </Box>
    </PdaLayout>
  )
}
