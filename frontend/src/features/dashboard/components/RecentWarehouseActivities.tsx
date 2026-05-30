/*
Senior Handover Note:
- Purpose: Hien thi lich su hoat dong kho tu stock transactions.
- Dependencies: DashboardRecentWarehouseActivity.
- API contract: warehouse_operations.recent_activities.
- Role access: ADMIN/WAREHOUSE/VIEWER.
- Maintenance notes: transaction_type la source of truth cho audit inventory mutation.
*/

import { Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardRecentWarehouseActivity } from '../types/dashboard.types'

const colorByType: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  IMPORT: 'success',
  EXPORT: 'warning',
  ADJUST: 'info',
  ROLLBACK: 'error',
}

export function RecentWarehouseActivities({ items }: { items: DashboardRecentWarehouseActivity[] }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Hoạt động kho gần đây</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Loại</TableCell>
            <TableCell>Reference</TableCell>
            <TableCell>Sản phẩm</TableCell>
            <TableCell align="right">SL</TableCell>
            <TableCell>Thời gian</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>Không có dữ liệu.</TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Chip size="small" color={colorByType[item.transaction_type] || 'default'} label={item.transaction_type} />
              </TableCell>
              <TableCell>{item.reference_code || '-'}</TableCell>
              <TableCell>{item.product_code} - {item.product_name}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell>{item.created_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
