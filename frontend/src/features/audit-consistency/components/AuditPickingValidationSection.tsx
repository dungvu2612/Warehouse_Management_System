/*
- Mục đích: Section B - doi soat thong so picking task va cac sai lech thao tac pick.
- Phụ thuộc: Nhan `picking_validation` tu ket qua audit da normalize.
- Logic audit: Chi hien thi metric, khong tinh toan lai.
- Giả định API: Gia tri duplicated/tray mismatch da duoc adapter map san.
- Ghi chú bảo trì: Co the them metric moi ma khong anh huong section khac.
*/

import { Paper, Stack, Typography } from '@mui/material'
import type { AuditPickingValidation } from '../types/auditConsistencyTypes'

interface AuditPickingValidationSectionProps {
  data: AuditPickingValidation
}

export function AuditPickingValidationSection({ data }: AuditPickingValidationSectionProps) {
  return (
    <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0' }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          B. Picking Validation
        </Typography>
        <Typography>picking task count: <strong>{data.picking_task_count}</strong></Typography>
        <Typography>picked quantity: <strong>{data.picked_quantity}</strong></Typography>
        <Typography>missing quantity: <strong>{data.missing_quantity}</strong></Typography>
        <Typography>duplicated picking: <strong>{data.duplicated_picking}</strong></Typography>
        <Typography>tray mismatch: <strong>{data.tray_mismatch}</strong></Typography>
      </Stack>
    </Paper>
  )
}
