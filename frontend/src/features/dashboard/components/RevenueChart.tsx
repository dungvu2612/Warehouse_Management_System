/*
Senior Handover Note:
- Purpose: Render doanh thu theo ngay o dang table/card nhe.
- Dependencies: DashboardRevenueSeriesItem type.
- API contract: Du lieu tu admin_revenue.revenue_series.
- Role access: Chi ADMIN.
- Maintenance notes: Khong them chart dependency nang; TODO neu can chart visual sau.
*/

import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardRevenueSeriesItem } from '../types/dashboard.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
}

export function RevenueChart({ series }: { series: DashboardRevenueSeriesItem[] }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Doanh thu theo ngày (14 ngày gần nhất)</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Ngày</TableCell>
            <TableCell align="right">Doanh thu</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {series.length === 0 && (
            <TableRow>
              <TableCell colSpan={2}>Không có dữ liệu doanh thu.</TableCell>
            </TableRow>
          )}
          {series.map((item) => (
            <TableRow key={item.date}>
              <TableCell>{item.date}</TableCell>
              <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
