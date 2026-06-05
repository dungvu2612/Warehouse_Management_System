/*
- Mục đích: Card tong quan trang thai audit (OK/WARNING/ERROR) cho supervisor nhin nhanh.
- Phụ thuộc: Nhan `AuditSummary` da tinh toan tu API adapter.
- Logic audit: Chỉ render tổng hợp, không tự tính trạng thái.
- Giả định API: summary.headline và các bộ đếm đã được chuẩn hóa.
- Ghi chú bảo trì: Neu doi visual theme, sua tai component nay de khong anh huong section khac.
*/

import { Alert, Chip, Paper, Stack, Typography } from '@mui/material'
import type { AuditSummary } from '../types/auditConsistencyTypes'

interface AuditSummaryCardProps {
  summary: AuditSummary
}

export function AuditSummaryCard({ summary }: AuditSummaryCardProps) {
  const severity =
    summary.overall_status === 'OK'
      ? 'success'
      : summary.overall_status === 'WARNING'
        ? 'warning'
        : 'error'

  return (
    <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0' }}>
      <Stack spacing={1.2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Trạng thái tổng: {summary.overall_status}
          </Typography>
          <Chip color={severity} label={summary.headline} sx={{ fontWeight: 800 }} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" label={`Vấn đề: ${summary.issue_count}`} />
          <Chip size="small" color="warning" label={`Cảnh báo: ${summary.warning_count}`} />
          <Chip size="small" color="error" label={`Lỗi: ${summary.error_count}`} />
          <Chip size="small" color="error" variant="outlined" label={`Nghiêm trọng: ${summary.critical_count}`} />
        </Stack>

        <Alert severity={severity}>Kiểm tra lúc: {new Date(summary.checked_at).toLocaleString('vi-VN')}</Alert>
      </Stack>
    </Paper>
  )
}
