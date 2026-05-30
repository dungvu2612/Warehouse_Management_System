/*
Senior Handover Note:
- Purpose: Danh sach don hoan tat gan day cho admin.
- Dependencies: DashboardRecentCompletedOrderItem.
- API contract: admin_revenue.recent_completed_orders.
- Role access: Chi ADMIN.
- Maintenance notes: completed_at fallback tu updated_at neu backend chua co completed_at rieng.
*/

import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardRecentCompletedOrderItem } from '../types/dashboard.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
}

export function RecentCompletedOrders({ items }: { items: DashboardRecentCompletedOrderItem[] }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Đơn hoàn tất gần đây</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã đơn</TableCell>
            <TableCell>Khách hàng</TableCell>
            <TableCell align="right">Tổng tiền</TableCell>
            <TableCell>Hoàn tất lúc</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>Không có dữ liệu.</TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={`${item.order_code}-${item.updated_at}`}>
              <TableCell>{item.order_code}</TableCell>
              <TableCell>{item.customer_name || '-'}</TableCell>
              <TableCell align="right">{formatCurrency(item.total_amount)}</TableCell>
              <TableCell>{item.completed_at || item.updated_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
