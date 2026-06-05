/*
- Mục đích: Hien thi top moving products dua tren EXPORT transactions.
- Phụ thuộc: DashboardTopMovingProduct.
- Hợp đồng API: warehouse_operations.top_moving_products.
- Role access: ADMIN/WAREHOUSE.
- Ghi chú bảo trì: So lieu movement la tong xuat kho, khong phai doanh thu.
*/

import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardTopMovingProduct } from '../types/dashboard.types'

export function TopMovingProducts({ items }: { items: DashboardTopMovingProduct[] }) {
  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Sản phẩm bán chạy nhất</Typography>
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
              <TableCell sx={{ fontWeight: 800 }}>Mã SP</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Tên SP</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>SL xuất</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>Không có dữ liệu.</TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.product_id}>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{item.product_code}</TableCell>
                <TableCell>{item.product_name}</TableCell>
                <TableCell align="right">{item.export_quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  )
}
