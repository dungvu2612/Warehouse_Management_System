/*
- Mục đích: Hien thi top san pham thanh pham ban nhieu nhat.
- Phụ thuộc: DashboardTopFinishedProductItem.
- Hợp đồng API: admin_revenue.top_finished_products.
- Role access: Chi ADMIN.
- Ghi chú bảo trì: Contract da loc product_type=FINISHED_GOOD tai backend.
*/

import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardTopFinishedProductItem } from '../types/dashboard.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
}

export function TopFinishedProducts({ items }: { items: DashboardTopFinishedProductItem[] }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Top thành phẩm bán chạy</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã SP</TableCell>
            <TableCell>Tên SP</TableCell>
            <TableCell align="right">SL bán</TableCell>
            <TableCell align="right">Doanh thu</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>Không có dữ liệu.</TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.product_id}>
              <TableCell>{item.product_code}</TableCell>
              <TableCell>{item.product_name}</TableCell>
              <TableCell align="right">{item.quantity_sold}</TableCell>
              <TableCell align="right">{formatCurrency(item.revenue_amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
