/*
- Mục đích: Hien thi lich su hoat dong kho tu stock transactions.
- Phụ thuộc: DashboardRecentWarehouseActivity.
- Hợp đồng API: warehouse_operations.recent_activities.
- Role access: ADMIN/WAREHOUSE.
- Ghi chú bảo trì: transaction_type la source of truth cho audit inventory mutation.
*/

import { Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardRecentWarehouseActivity } from '../types/dashboard.types'

const colorByType: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  IMPORT: 'success',
  EXPORT: 'warning',
  ADJUST: 'info',
  ROLLBACK: 'error',
}

const typeLabel: Record<string, string> = {
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  ADJUST: 'Điều chỉnh',
  ROLLBACK: 'Hoàn tác',
}

function signedQuantity(transactionType: string, quantity: number) {
  if (transactionType === 'EXPORT') return -Math.abs(quantity)
  if (transactionType === 'IMPORT') return Math.abs(quantity)
  return quantity
}

function formatSignedQuantity(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

export function RecentWarehouseActivities({ items }: { items: DashboardRecentWarehouseActivity[] }) {
  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Hoạt động xuất kho gần đây</Typography>
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
              <TableCell sx={{ fontWeight: 800 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Mã tham chiếu</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>SL</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>Không có dữ liệu.</TableCell>
              </TableRow>
            )}
            {items.map((item) => {
              const displayQuantity = signedQuantity(item.transaction_type, item.quantity)
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Chip size="small" color={colorByType[item.transaction_type] || 'default'} label={typeLabel[item.transaction_type] || item.transaction_type} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{item.reference_code || '-'}</TableCell>
                  <TableCell>{item.product_code} - {item.product_name}</TableCell>
                  <TableCell align="right">{formatSignedQuantity(displayQuantity)}</TableCell>
                  <TableCell>{item.created_at}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  )
}
