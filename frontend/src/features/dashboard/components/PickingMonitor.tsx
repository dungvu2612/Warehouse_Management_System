/*
- Mục đích: Hien thi monitor task picking (WAITING/PICKING/DONE + recent tasks).
- Phụ thuộc: DashboardPickingMonitor.
- Hợp đồng API: warehouse_operations.picking_monitor.
- Role access: ADMIN/WAREHOUSE.
- Ghi chú bảo trì: Chỉ xem monitor, khong cho confirm tai section nay.
*/

import { Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { DashboardPickingMonitor } from '../types/dashboard.types'

const colorByStatus: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
  WAITING: 'warning',
  PICKING: 'info',
  DONE: 'success',
}

const statusLabel: Record<string, string> = {
  WAITING: 'Chờ nhặt',
  PICKING: 'Đang nhặt',
  DONE: 'Đã xong',
}

export function PickingMonitor({ monitor }: { monitor: DashboardPickingMonitor }) {
  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Theo dõi nhặt hàng</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.2 }}>
        <Chip color="warning" label={`Chờ nhặt: ${monitor.waiting_tasks}`} />
        <Chip color="info" label={`Đang nhặt: ${monitor.picking_tasks}`} />
        <Chip color="success" label={`Đã xong: ${monitor.done_tasks}`} />
      </Box>
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
              <TableCell sx={{ fontWeight: 800 }}>Đơn</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Khay</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Yêu cầu</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Đã nhặt</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
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
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{task.order_code}</TableCell>
                <TableCell>{task.product_code} - {task.product_name}</TableCell>
                <TableCell>{task.tray_code}</TableCell>
                <TableCell align="right">{task.required_quantity}</TableCell>
                <TableCell align="right">{task.picked_quantity}</TableCell>
                <TableCell>
                  <Chip size="small" color={colorByStatus[task.status] || 'default'} label={statusLabel[task.status] || task.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  )
}
