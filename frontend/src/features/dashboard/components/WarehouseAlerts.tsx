/*
Senior Handover Note:
- Purpose: Hien thi warehouse alerts (low/out of stock).
- Dependencies: DashboardWarehouseAlert type.
- API contract: warehouse_operations.warehouse_alerts.
- Role access: ADMIN/WAREHOUSE/VIEWER (read-only).
- Maintenance notes: Severity color map can duoc cap nhat neu backend them muc moi.
*/

import { Alert, Paper, Stack, Typography } from '@mui/material'
import type { DashboardWarehouseAlert } from '../types/dashboard.types'

function severityToMui(severity: string): 'info' | 'warning' | 'error' | 'success' {
  if (severity === 'CRITICAL') return 'error'
  if (severity === 'WARNING') return 'warning'
  return 'info'
}

export function WarehouseAlerts({ alerts }: { alerts: DashboardWarehouseAlert[] }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Cảnh báo kho</Typography>
      <Stack spacing={1}>
        {/* Senior Handover: warehouse alert mapping block */}
        {alerts.length === 0 && <Alert severity="success">Không có cảnh báo kho.</Alert>}
        {alerts.map((item) => (
          <Alert key={`${item.alert_type}-${item.product_id}`} severity={severityToMui(item.severity)}>
            [{item.alert_type}] {item.product_code} - {item.product_name}: {item.message} (Tồn {item.current_quantity} / Min {item.min_stock})
          </Alert>
        ))}
      </Stack>
    </Paper>
  )
}
