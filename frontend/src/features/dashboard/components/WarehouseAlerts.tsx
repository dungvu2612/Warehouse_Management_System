/*
- Mục đích: Hien thi warehouse alerts (low/out of stock).
- Phụ thuộc: DashboardWarehouseAlert type.
- Hợp đồng API: warehouse_operations.warehouse_alerts.
- Role access: ADMIN/WAREHOUSE (chỉ xem).
- Ghi chú bảo trì: Severity color map can duoc cap nhat neu backend them muc moi.
*/

import { Alert, Box, Paper, Stack, Typography } from '@mui/material'
import { formatDateTimeVN } from '../../../shared/lib/datetime'
import type { DashboardWarehouseAlert } from '../types/dashboard.types'

function severityToMui(severity: string): 'info' | 'warning' | 'error' | 'success' {
  if (severity === 'CRITICAL') return 'error'
  if (severity === 'WARNING') return 'warning'
  return 'info'
}

export function WarehouseAlerts({ alerts }: { alerts: DashboardWarehouseAlert[] }) {
  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Cảnh báo kho</Typography>
      <Box
        sx={{
          maxHeight: { xs: 260, md: 320 },
          overflowY: 'auto',
          pr: 0.75,
        }}
      >
        <Stack spacing={1}>
          {/* Ghi chú: Khối map cảnh báo kho, giới hạn chiều cao để dashboard không bị kéo dài. */}
          {alerts.length === 0 && <Alert severity="success">Không có cảnh báo kho.</Alert>}
          {alerts.map((item) => (
            <Alert key={`${item.alert_type}-${item.product_id}`} severity={severityToMui(item.severity)}>
              [{item.alert_type}] {item.product_code} - {item.product_name}: {item.message} (Tồn {item.current_quantity} / Min {item.min_stock})
              {item.alert_type === 'OUT_OF_STOCK' && (
                <Typography component="span" sx={{ display: 'block', mt: 0.4, fontSize: 13, fontWeight: 700 }}>
                  Hết hàng lúc: {item.out_of_stock_at ? formatDateTimeVN(item.out_of_stock_at) : 'Chưa có dữ liệu'}
                </Typography>
              )}
            </Alert>
          ))}
        </Stack>
      </Box>
    </Paper>
  )
}
