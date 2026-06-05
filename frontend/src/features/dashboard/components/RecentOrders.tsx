/*
- Mục đích: Hien thi danh sach order gan day cho warehouse supervisor.
- Phụ thuộc: DashboardRecentOrder.
- Hợp đồng API: warehouse_operations.recent_orders.
- Role access: ADMIN/WAREHOUSE.
- Ghi chú bảo trì: Chỉ xem list.
*/

import { Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardRecentOrder } from '../types/dashboard.types'

const colorByStatus: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PICKING: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PICKING: 'Đang nhặt',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export function RecentOrders({ items }: { items: DashboardRecentOrder[] }) {
  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Đơn hàng gần đây</Typography>
      <Box
        sx={{
          maxHeight: { xs: 260, md: 320 },
          overflowY: 'auto',
          overflowX: 'auto',
          pr: 0.75,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Mã đơn</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Khách hàng</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>Không có dữ liệu.</TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={`${item.order_code}-${item.created_at}`}>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{item.order_code}</TableCell>
                <TableCell>{item.customer_name || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" color={colorByStatus[item.status] || 'default'} label={statusLabel[item.status] || item.status} />
                </TableCell>
                <TableCell>{item.created_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  )
}
