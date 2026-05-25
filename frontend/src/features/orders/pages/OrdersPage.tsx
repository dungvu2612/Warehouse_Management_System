/*
Mo ta file:
- Trang Orders chinh theo clean architecture.
- Page nay giu vai tro coordinator: quan ly state man hinh, goi hooks, ghep components.

Luong xu ly:
1) Query danh sach orders + options BOM + tasks/progress theo order duoc chon.
2) Xu ly action create/scan/confirm/finish thong qua mutation hooks.
3) Hien thi banner message va dieu phoi cac component con.
*/

import { useEffect, useMemo, useState } from 'react'
import { Add, QrCodeScanner, Refresh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { defaultOrderCreateForm, defaultScanOrderForm } from '../constants/orderForm'
import {
  useConfirmPickingMutation,
  useCreateOrderMutation,
  useFinishOrderMutation,
  useOrderBOMOptionsQuery,
  useOrderProgressQuery,
  useOrderTasksQuery,
  useOrdersQuery,
  useScanOrderMutation,
} from '../hooks/useOrders'
import { OrderCreateDialog } from '../components/OrderCreateDialog'
import { OrderTable } from '../components/OrderTable'
import { PickingPanel } from '../components/PickingPanel'
import { orderService } from '../services/orderService'
import type { ConfirmPickingPayload, Order, OrderCreatePayload, OrderStatus } from '../types/orderTypes'
import { mapOrderApiError } from '../utils/orderError'
import { validateOrderCreateForm, validateScanOrderForm } from '../utils/orderValidation'

export function OrdersPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const canCreate = user?.role === 'ADMIN'
  const canOperate = user?.role === 'ADMIN' || user?.role === 'STAFF'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<OrderCreatePayload>(defaultOrderCreateForm)
  const [createError, setCreateError] = useState('')

  const [scanForm, setScanForm] = useState(defaultScanOrderForm)
  const [scanError, setScanError] = useState('')

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const ordersQuery = useOrdersQuery(statusFilter === 'ALL' ? undefined : statusFilter)
  const bomOptionsQuery = useOrderBOMOptionsQuery()
  const tasksQuery = useOrderTasksQuery(selectedOrder?.id ?? null)
  const progressQuery = useOrderProgressQuery(selectedOrder?.id ?? null)

  useEffect(() => {
    const state = location.state as { selectedOrder?: Order } | null
    if (state?.selectedOrder) {
      setSelectedOrder(state.selectedOrder)
    }
  }, [location.state])

  const createMutation = useCreateOrderMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Tạo đơn hàng thành công.' })
      setCreateOpen(false)
      setCreateError('')
      setCreateForm(defaultOrderCreateForm)
    },
    onError: (error) => {
      setCreateError(mapOrderApiError(error))
    },
  })

  const scanMutation = useScanOrderMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Scan đơn hàng thành công, đã cập nhật luồng picking.' })
      setScanError('')
      setScanForm(defaultScanOrderForm)
    },
    onError: (error) => {
      setScanError(mapOrderApiError(error))
    },
  })

  const confirmMutation = useConfirmPickingMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Xác nhận picking task thành công.' })
    },
    onError: (error) => {
      setBanner({ type: 'error', text: mapOrderApiError(error) })
    },
  })

  const finishMutation = useFinishOrderMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Đã finish order thành công.' })
    },
    onError: (error) => {
      setBanner({ type: 'error', text: mapOrderApiError(error) })
    },
  })

  const filteredOrders = useMemo(() => {
    return orderService.filterOrdersByKeyword(ordersQuery.data || [], search)
  }, [ordersQuery.data, search])

  const handleSubmitCreate = () => {
    setCreateError('')

    const validationError = validateOrderCreateForm(createForm)
    if (validationError) {
      setCreateError(validationError)
      return
    }

    createMutation.mutate(createForm)
  }

  const handleScanOrder = () => {
    setScanError('')

    const validationError = validateScanOrderForm(scanForm)
    if (validationError) {
      setScanError(validationError)
      return
    }

    scanMutation.mutate(scanForm, {
      onSuccess: (result) => {
        setSelectedOrder(result.order)
      },
    })
  }

  const handleOpenPicking = (order: Order) => {
    setSelectedOrder(order)
  }

  const handleOpenDetail = (order: Order) => {
    navigate(`/orders/${order.id}`)
  }

  const handleFinishOrder = (order: Order) => {
    if (!canOperate) return

    if (!window.confirm(`Finish order ${order.order_code}?`)) {
      return
    }

    finishMutation.mutate(order.id)
  }

  const handleConfirmTask = (taskId: number, payload: ConfirmPickingPayload) => {
    confirmMutation.mutate({ taskId, payload })
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Quản lý đơn hàng & picking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tạo đơn từ BOM, scan để sinh picking tasks, xác nhận picking và hoàn tất đơn.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => ordersQuery.refetch()}>
              Làm mới
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              disabled={!canCreate}
              onClick={() => setCreateOpen(true)}
            >
              Tạo đơn
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}

      {!canCreate && (
        <Alert severity="info">Role STAFF không được tạo đơn, nhưng có thể scan/confirm/finish.</Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { lg: 'center' } }}>
          <TextField
            label="Tìm đơn hàng"
            placeholder="Tìm theo order_code, khách hàng, qr_code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="PENDING">PENDING</MenuItem>
            <MenuItem value="PICKING">PICKING</MenuItem>
            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
            <MenuItem value="CANCELLED">CANCELLED</MenuItem>
          </TextField>

          <Chip
            color="secondary"
            label={`Tổng đơn: ${filteredOrders.length}`}
            sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', lg: 'center' } }}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mt: 2 }}>
          <TextField
            label="Scan order code / QR"
            value={scanForm.order_code}
            onChange={(e) => setScanForm({ order_code: e.target.value })}
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={<QrCodeScanner />}
            onClick={handleScanOrder}
            disabled={!canOperate || scanMutation.isPending}
          >
            {scanMutation.isPending ? 'Đang scan...' : 'Scan order'}
          </Button>
        </Stack>

        {scanError && <Alert severity="error" sx={{ mt: 1.2 }}>{scanError}</Alert>}

        <Box sx={{ mt: 2.2 }}>
          <OrderTable
            orders={filteredOrders}
            isLoading={ordersQuery.isLoading}
            isError={ordersQuery.isError}
            canOperate={canOperate}
            onOpenDetail={handleOpenDetail}
            onOpenPicking={handleOpenPicking}
            onFinishOrder={handleFinishOrder}
          />
        </Box>
      </Paper>

      <PickingPanel
        order={selectedOrder}
        tasks={tasksQuery.data?.tasks || []}
        progress={progressQuery.data || null}
        isLoadingTasks={tasksQuery.isLoading || progressQuery.isLoading}
        canOperate={canOperate}
        confirmPending={confirmMutation.isPending}
        onConfirmTask={handleConfirmTask}
      />

      <OrderCreateDialog
        open={createOpen}
        form={createForm}
        bomOptions={bomOptionsQuery.data || []}
        isSubmitting={createMutation.isPending}
        errorMessage={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmitCreate}
        onChange={setCreateForm}
      />
    </Stack>
  )
}
