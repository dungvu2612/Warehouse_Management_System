/*
Mo ta file:
- Bang hien thi danh sach orders va action chinh cua module.
- Component nay thuoc presentation layer, khong chua logic API.

Luong xu ly:
1) Render loading/error/empty states.
2) Render list orders va action mo picking/finish theo role.
3) Emit callback ve page de xu ly mutation.
*/

import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { Order } from '../types/orderTypes'

interface OrderTableProps {
  orders: Order[]
  isLoading: boolean
  isError: boolean
  canOperate: boolean
  onOpenDetail: (order: Order) => void
  onOpenPicking: (order: Order) => void
  onFinishOrder: (order: Order) => void
}

function statusColor(status: string): 'warning' | 'secondary' | 'success' | 'default' {
  if (status === 'PENDING') return 'warning'
  if (status === 'PICKING') return 'secondary'
  if (status === 'COMPLETED') return 'success'
  return 'default'
}

export function OrderTable({
  orders,
  isLoading,
  isError,
  canOperate,
  onOpenDetail,
  onOpenPicking,
  onFinishOrder,
}: OrderTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Order code</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Khách hàng</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>QR code</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Tổng tiền</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7}>Đang tải danh sách đơn hàng...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={7}>Không tải được danh sách đơn hàng.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>Không có đơn hàng phù hợp.</TableCell>
            </TableRow>
          )}

          {orders.map((order) => (
            <TableRow key={order.id} hover>
              <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                {order.order_code}
              </TableCell>
              <TableCell>{order.customer_name || '-'}</TableCell>
              <TableCell>
                <Chip size="small" color={statusColor(order.status)} label={order.status} />
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{order.qr_code}</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>
                {Number(order.total_amount || 0).toLocaleString('vi-VN')} đ
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleString('vi-VN')}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Button size="small" variant="text" onClick={() => onOpenDetail(order)}>
                  Detail
                </Button>{' '}
                <Button size="small" variant="outlined" onClick={() => onOpenPicking(order)}>
                  Picking
                </Button>{' '}
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={!canOperate || order.status !== 'PICKING'}
                  onClick={() => onFinishOrder(order)}
                >
                  Finish
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
