/*
Senior Handover Note:
- Purpose: Bang read-only danh sach orders sau replacement refactor.
- Dependencies: Nhan du lieu order tu OrdersPage, khong chua logic API/mutation.
- API contract: Render field theo GET /orders.
- Business rules: Khong render thao tac picking/finish/create tai Orders page.
- Replacement refactor notes: old action Picking/Finish da bi xoa.
- Maintenance notes: Neu can them action read-only (print shortcut), bo sung callback tu page cha.
*/

import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import { DeleteOutlined, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
import type { Order } from '../types/orderTypes'

interface OrderTableProps {
  orders: Order[]
  isLoading: boolean
  isError: boolean
  onOpenDetail: (order: Order) => void
  canManage?: boolean
  onEdit?: (order: Order) => void
  onDelete?: (order: Order) => void
}

function statusColor(status: string): 'warning' | 'secondary' | 'success' | 'default' {
  if (status === 'PENDING') return 'warning'
  if (status === 'PICKING') return 'secondary'
  if (status === 'COMPLETED') return 'success'
  return 'default'
}

function statusLabel(status: string): string {
  if (status === 'PENDING') return 'Chờ xử lý'
  if (status === 'PICKING') return 'Đang nhặt'
  if (status === 'COMPLETED') return 'Hoàn thành'
  if (status === 'CANCELLED') return 'Đã hủy'
  return status
}

export function OrderTable({
  orders,
  isLoading,
  isError,
  onOpenDetail,
  canManage = false,
  onEdit,
  onDelete,
}: OrderTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Mã đơn</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Khách hàng</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Số điện thoại</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã QR</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Tổng tiền</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8}>Đang tải danh sách đơn hàng...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={8}>Không tải được danh sách đơn hàng.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>Không có đơn hàng phù hợp.</TableCell>
            </TableRow>
          )}

          {orders.map((order) => (
            <TableRow key={order.id} hover>
              <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{order.order_code}</TableCell>
              <TableCell>{order.customer_name || '-'}</TableCell>
              <TableCell>{order.customer_phone || '-'}</TableCell>
              <TableCell>
                <Chip size="small" color={statusColor(order.status)} label={statusLabel(order.status)} />
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{order.qr_code}</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>
                {Number(order.total_amount || 0).toLocaleString('vi-VN')} đ
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleString('vi-VN')}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" color="primary" onClick={() => onOpenDetail(order)}>
                    <VisibilityOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                {canManage && (
                  <>
                    <Tooltip title="Sửa đơn">
                      <IconButton size="small" color="warning" onClick={() => onEdit?.(order)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa đơn">
                        <IconButton size="small" color="error" onClick={() => onDelete?.(order)}>
                        <DeleteOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
