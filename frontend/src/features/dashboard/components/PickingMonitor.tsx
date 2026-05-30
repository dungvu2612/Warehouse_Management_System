/*
Senior Handover Note:
- Purpose: Hien thi monitor task picking (WAITING/PICKING/DONE + recent tasks).
- Dependencies: DashboardPickingMonitor.
- API contract: warehouse_operations.picking_monitor.
- Role access: ADMIN/WAREHOUSE/VIEWER.
- Maintenance notes: Read-only monitor, khong cho confirm tai section nay.
*/

import { Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardPickingMonitor } from '../types/dashboard.types'

const colorByStatus: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
  WAITING: 'warning',
  PICKING: 'info',
  DONE: 'success',
}

export function PickingMonitor({ monitor }: { monitor: DashboardPickingMonitor }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Picking Monitor</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.2 }}>
        <Chip color="warning" label={`WAITING: ${monitor.waiting_tasks}`} />
        <Chip color="info" label={`PICKING: ${monitor.picking_tasks}`} />
        <Chip color="success" label={`DONE: ${monitor.done_tasks}`} />
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Sản phẩm</TableCell>
            <TableCell>Khay</TableCell>
            <TableCell align="right">Yêu cầu</TableCell>
            <TableCell align="right">Đã pick</TableCell>
            <TableCell>Trạng thái</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {monitor.recent_picking_tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>Không có dữ liệu task gần đây.</TableCell>
            </TableRow>
          )}
          {monitor.recent_picking_tasks.map((task) => (
            <TableRow key={task.task_id}>
              <TableCell>{task.order_code}</TableCell>
              <TableCell>{task.product_code} - {task.product_name}</TableCell>
              <TableCell>{task.tray_code}</TableCell>
              <TableCell align="right">{task.required_quantity}</TableCell>
              <TableCell align="right">{task.picked_quantity}</TableCell>
              <TableCell>
                <Chip size="small" color={colorByStatus[task.status] || 'default'} label={task.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
