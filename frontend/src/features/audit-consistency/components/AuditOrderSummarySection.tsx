/*
Senior Handover Note:
- Purpose: Section A - hien thi thong tin tong quan order de doi soat.
- Dependencies: Nhan `order_summary` tu `AuditConsistencyResult`.
- Audit logic: Chi render thong tin order source, khong xu ly normalize.
- API assumptions: Truong co the fallback "Data not provided by backend" neu thieu.
- Maintenance notes: Giu section nhe de supervisor doc nhanh.
*/

import { ContentCopy } from '@mui/icons-material'
import { IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import type { AuditOrderSummary } from '../types/auditConsistencyTypes'

interface AuditOrderSummarySectionProps {
  order: AuditOrderSummary
  onCopyOrderCode: (code: string) => void
}

export function AuditOrderSummarySection({ order, onCopyOrderCode }: AuditOrderSummarySectionProps) {
  return (
    <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0' }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          A. Order Summary
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800 }}>order_code:</Typography>
          <Typography sx={{ fontFamily: 'monospace' }}>{order.order_code}</Typography>
          <Tooltip title="Copy order code">
            <IconButton size="small" onClick={() => onCopyOrderCode(order.order_code)}>
              <ContentCopy fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography><strong>customer:</strong> {order.customer}</Typography>
        <Typography><strong>status:</strong> {order.status}</Typography>
        <Typography><strong>total_amount:</strong> {order.total_amount ?? 'Data not provided by backend'}</Typography>
        <Typography><strong>created_at:</strong> {order.created_at === 'Data not provided by backend' ? order.created_at : new Date(order.created_at).toLocaleString('vi-VN')}</Typography>
      </Stack>
    </Paper>
  )
}
