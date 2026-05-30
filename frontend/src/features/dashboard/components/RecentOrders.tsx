/*
Senior Handover Note:
- Purpose: Hien thi danh sach order gan day cho warehouse supervisor.
- Dependencies: DashboardRecentOrder.
- API contract: warehouse_operations.recent_orders.
- Role access: ADMIN/WAREHOUSE/VIEWER.
- Maintenance notes: Read-only list.
*/

import { Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardRecentOrder } from '../types/dashboard.types'

const colorByStatus: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PICKING: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
}

export function RecentOrders({ items }: { items: DashboardRecentOrder[] }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Đơn hàng gần đây</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã đơn</TableCell>
            <TableCell>Khách hàng</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Ngày tạo</TableCell>
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
              <TableCell>{item.order_code}</TableCell>
              <TableCell>{item.customer_name || '-'}</TableCell>
              <TableCell>
                <Chip size="small" color={colorByStatus[item.status] || 'default'} label={item.status} />
              </TableCell>
              <TableCell>{item.created_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
