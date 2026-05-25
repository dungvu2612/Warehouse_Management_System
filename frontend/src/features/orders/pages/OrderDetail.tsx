/*
Mo ta file:
- Trang chi tiet Order theo contract GET /orders/:id.
- Page giu vai tro coordinator: lay route param, goi query hook, dieu huong sang Picking Mode.

Luong xu ly:
1) Doc order id tu URL va fetch order detail.
2) Render progress, shortage realtime va danh sach picking tasks.
3) Chi hien action "Chuyen sang Picking Mode" khi role/status du dieu kien nghiep vu.

Senior handover:
- Backend da tra san read-model product/location/inventory, page khong tu join du lieu.
- Khi tach Picking Mode thanh route rieng, chi can doi handleOpenPickingMode.
*/

import { ArrowBack, QrCodeScanner, Refresh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { useOrderByIdQuery } from '../hooks/useOrders'
import type { OrderDetailPickingTask, PickingStatus } from '../types/orderTypes'

function statusColor(status: PickingStatus | string): 'warning' | 'secondary' | 'success' | 'default' {
  if (status === 'WAITING') return 'warning'
  if (status === 'PICKING') return 'secondary'
  if (status === 'DONE') return 'success'
  return 'default'
}

function formatQty(value: number) {
  return Number(value || 0).toLocaleString('vi-VN')
}

function TaskCards({ tasks }: { tasks: OrderDetailPickingTask[] }) {
  return (
    <Box
      sx={{
        display: { xs: 'grid', lg: 'none' },
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 1.5,
      }}
    >
      {tasks.map((task) => (
        <Paper key={task.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={1.2}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
                  {task.product_name || `Product #${task.product_id}`}
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {task.product_code || '-'}
                </Typography>
              </Box>
              <Chip color={statusColor(task.status)} label={task.status} sx={{ fontWeight: 900 }} />
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip label={`Vị trí ${task.location_code || '-'}`} sx={{ fontSize: 16, fontWeight: 800 }} />
              <Chip label={`Khay ${task.tray_code || '-'}`} sx={{ fontSize: 16, fontWeight: 800 }} />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography color="text.secondary">Required</Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 900 }}>{formatQty(task.required_quantity)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography color="text.secondary">Actual</Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 900 }}>{formatQty(task.picked_quantity)}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const orderId = Number(id)
  const detailQuery = useOrderByIdQuery(Number.isFinite(orderId) ? orderId : null)

  const detail = detailQuery.data
  const order = detail?.order
  const canOpenPickingMode = Boolean(order && (user?.role === 'STAFF' || order.status === 'PICKING'))
  const progressValue = Math.round(detail?.progress.percent || 0)

  const handleOpenPickingMode = () => {
    if (!order) return
    navigate('/orders', { state: { selectedOrder: order } })
  }

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return <Alert severity="error">Order id không hợp lệ.</Alert>
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Stack spacing={0.8}>
            <Button
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/orders')}
              sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
            >
              Quay lại
            </Button>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {order?.order_code || 'Order Detail'}
              </Typography>
              <Typography color="text.secondary">
                {order?.customer_name || '-'} · {order?.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '-'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            {order && <Chip color="secondary" label={order.status} sx={{ fontWeight: 900 }} />}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => detailQuery.refetch()}
              disabled={detailQuery.isFetching}
            >
              Làm mới
            </Button>
            {canOpenPickingMode && (
              <Button variant="contained" size="large" startIcon={<QrCodeScanner />} onClick={handleOpenPickingMode}>
                Chuyển sang Picking Mode
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {detailQuery.isError && <Alert severity="error">Không tải được chi tiết đơn hàng.</Alert>}

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={1.2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 900 }}>Progress</Typography>
            <Typography sx={{ fontWeight: 900 }}>
              {detail?.progress.done_tasks || 0}/{detail?.progress.total_tasks || 0} tasks · {progressValue}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ height: 12, borderRadius: 99, bgcolor: 'grey.100' }}
          />
        </Stack>
      </Paper>

      {detail?.shortage.has_shortage && (
        <Alert severity="warning">
          Thiếu hàng: {detail.shortage.items.map((item) => `${item.product_code || item.product_id} thiếu ${item.missing_qty}`).join(', ')}
        </Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 900 }}>Picking tasks</Typography>

          {detailQuery.isLoading && <Typography>Đang tải picking tasks...</Typography>}

          {!detailQuery.isLoading && detail?.picking_tasks.length === 0 && (
            <Alert severity="info">Order chưa có picking task.</Alert>
          )}

          {detail && <TaskCards tasks={detail.picking_tasks} />}

          <TableContainer sx={{ display: { xs: 'none', lg: 'block' }, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Mã vị trí</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Khay</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Qty Required</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Qty Actual</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Tồn hiện tại</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {detail?.picking_tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 900 }}>{task.product_name || '-'}</Typography>
                      <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                        {task.product_code || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 18, fontWeight: 900 }}>{task.location_code || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{task.tray_code || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>
                      {formatQty(task.required_quantity)}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>
                      {formatQty(task.picked_quantity)}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{formatQty(task.inventory_qty)}</TableCell>
                    <TableCell>
                      <Chip color={statusColor(task.status)} label={task.status} sx={{ fontWeight: 900 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Paper>
    </Stack>
  )
}
