/*
Senior Handover Note:
- Purpose: Staff picking detail mobile layout cho HT730.
- Dependencies: Order detail query, PDA scan mutations, centralized scanner, PdaLayout, PickingItemCard, scan panels.
- API contract: GET /orders/:id, POST /orders/picking-tasks/:id/verify-tray, POST /orders/picking-tasks/:id/scan-product.
- HT730 scanner behavior: TagAccess Keyboard types QR into one focused hidden input and sends Enter.
- API callback contract: TRAY verifies selected task tray; PRODUCT scans one product unit.
- Maintenance notes: Desktop order print is separate from PDA picking layout.
*/

import { useEffect, useMemo, useState } from 'react'
import { QrCode2 } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
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
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

export function StaffPickingDetailPage() {
  const { orderId } = useParams()
  const numericOrderId = Number(orderId)
  const detailQuery = useOrderByIdQuery(Number.isFinite(numericOrderId) ? numericOrderId : null)
  const verifyTrayMutation = usePDAVerifyTrayMutation()
  const scanProductMutation = usePDAScanProductMutation()

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [verifiedTrayCode, setVerifiedTrayCode] = useState('')
  const [productFeedback, setProductFeedback] = useState<{ severity: 'success' | 'error' | 'info' | 'warning'; title: string; message: string } | null>(null)
  const [taskPage, setTaskPage] = useState(1)

  const detail = detailQuery.data
  const tasks = detail?.picking_tasks || []
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null
  const openTasks = tasks.filter((task) => task.status !== 'DONE')
  const paginatedTasks = useMemo(() => {
    return paginateItems(tasks, taskPage, DEFAULT_PAGE_SIZE)
  }, [tasks, taskPage])

  useEffect(() => {
    if (selectedTaskId || tasks.length === 0) return
    const firstOpenTask = tasks.find((task) => task.status !== 'DONE')
    if (firstOpenTask) setSelectedTaskId(firstOpenTask.id)
  }, [selectedTaskId, tasks])

  useEffect(() => {
    // Senior Handover: Reset page to 1 whenever search/filter changes.
    setTaskPage(1)
  }, [numericOrderId])

  const progressLabel = useMemo(() => {
    if (!detail) return '0/0'
    return `${detail.progress.done_tasks}/${detail.progress.total_tasks}`
  }, [detail])

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
    // Senior Handover: HT730 scanner works as keyboard wedge, so this page keeps a hidden input focused.
    // Senior Handover: Auto scan mode removes the need to press Scan QR before every scan.
    // Senior Handover: Scan type is inferred from the current picking state, not from a manual button.
    // Senior Handover: Scanner logic is centralized here to avoid duplicate handlers.
    onScanComplete: async ({ code }) => {
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
    if (isBusy) return 'PROCESSING_SCAN'
    if (openTasks.length === 0) return 'COMPLETED'
    if (!selectedTask) return 'READY_TO_SCAN_TRAY'
    if (!verifiedTrayCode) return 'READY_TO_SCAN_TRAY'
    return 'READY_TO_SCAN_PRODUCT'
  }, [isBusy, openTasks.length, selectedTask, verifiedTrayCode])

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
      title={detail?.order.order_code || 'Nhặt hàng'}
      subtitle={`Tiến độ ${progressLabel}`}
    >
      {detailQuery.isLoading && <Alert severity="info">Đang tải đơn...</Alert>}
      {detailQuery.isError && <Alert severity="error">Không tải được chi tiết đơn.</Alert>}

      {detail && (
        <>
          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: 19, fontWeight: 900 }} noWrap>
                    {detail.order.order_code}
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>
                    {new Date(detail.order.created_at).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <QrCode2 sx={{ color: 'text.secondary' }} />
                  <Chip label={detail.order.status} color="secondary" sx={{ fontWeight: 900 }} />
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={0.75}>
              <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Khách hàng</Typography>
              <Typography sx={{ fontSize: 15 }}>{detail.order.customer_name || '-'}</Typography>
              <Typography sx={{ fontSize: 15 }}>{detail.order.customer_phone || '-'}</Typography>
              <Typography sx={{ fontSize: 15 }}>{detail.order.customer_address || '-'}</Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 900 }}>
                {currentScanStep === 'READY_TO_SCAN_TRAY' && 'Sẵn sàng quét mã khay'}
                {currentScanStep === 'READY_TO_SCAN_PRODUCT' && 'Sẵn sàng quét mã sản phẩm'}
                {currentScanStep === 'PROCESSING_SCAN' && 'Đang xử lý mã...'}
                {currentScanStep === 'COMPLETED' && 'Đơn đã hoàn thành'}
              </Typography>
              {selectedTask && (
                <Typography sx={{ color: 'text.secondary' }}>
                  Task hiện tại: {selectedTask.product_code || '-'} · Khay cần: {selectedTask.tray_code || '-'}
                </Typography>
              )}
              <Stack direction="row" spacing={1}>
                <Button type="button" variant="outlined" onClick={() => scanner.focusScannerInput()}>
                  Đưa con trỏ quét về máy scan
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setVerifiedTrayCode('')
                    scanner.resumeScanner('TRAY')
                  }}
                  disabled={!selectedTask}
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
              pageSize={DEFAULT_PAGE_SIZE}
              onPageChange={(page) => {
                setTaskPage(page)
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
