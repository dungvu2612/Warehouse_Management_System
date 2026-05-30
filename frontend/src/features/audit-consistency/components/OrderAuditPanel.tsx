/*
Senior Handover Note:
- Purpose: Audit panel reusable de nhung truc tiep trong Order Detail, thay the audit page standalone.
- Dependencies: Hooks/module audit-consistency + PickLogsTable reusable.
- API contract: GET /audit/consistency/:order_id va endpoint enrich trong adapter.
- Business rules: Audit la read-only; khong tao mutation tai panel nay.
- Replacement refactor notes: standalone Audit route/menu da bo, panel nay la diem truy cap audit duy nhat tu order context.
- Scanner workflow notes: Khong tham gia scanner flow; chi audit sau thao tac PDA.
- Maintenance notes: Neu doi structure section audit, sua tai day va giu normalize tai api layer.
*/

import { useMemo, useState } from 'react'
import { Alert, Box, Button, Collapse, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { AuditSummaryCard } from './AuditSummaryCard'
import { AuditOrderSummarySection } from './AuditOrderSummarySection'
import { AuditPickingValidationSection } from './AuditPickingValidationSection'
import { AuditInventoryValidationSection } from './AuditInventoryValidationSection'
import { AuditIssuesSection } from './AuditIssuesSection'
import { useAuditConsistencyQuery } from '../hooks/useAuditConsistency'
import { PickLogsTable } from '../../pick-logs/components/PickLogsTable'
import type { PickLogDisplayItem } from '../../pick-logs/types/pickLogTypes'

interface OrderAuditPanelProps {
  orderId: number
  orderCode: string
}

export function OrderAuditPanel({ orderId, orderCode }: OrderAuditPanelProps) {
  const [showPickLogs, setShowPickLogs] = useState(true)
  const [copyMessage, setCopyMessage] = useState('')
  const auditQuery = useAuditConsistencyQuery(orderId)

  const result = auditQuery.data

  const pickLogRowsForTable = useMemo<PickLogDisplayItem[]>(() => {
    if (!result) return []
    return result.pick_logs.map((log) => ({
      id: log.id,
      picking_task_id: null,
      order_id: orderId,
      product_id: null,
      tray_id: null,
      picked_quantity: log.picked_quantity,
      picked_by: null,
      picked_at: log.picked_at,
      note: log.note,
      order_code: log.order_code || orderCode,
      product_code: log.product_code,
      product_name: log.product_name,
      tray_code: log.tray_code,
      picked_by_label: log.picked_by,
      picked_status: 'PICKED',
      verified: log.verified,
    }))
  }, [orderCode, orderId, result])

  const handleCopyOrderCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(`Đã copy order code: ${value}`)
      window.setTimeout(() => setCopyMessage(''), 1500)
    } catch {
      setCopyMessage('Không thể copy order code trên trình duyệt hiện tại.')
      window.setTimeout(() => setCopyMessage(''), 1500)
    }
  }

  const handleCopyTrayCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(`Đã copy mã khay: ${value}`)
      window.setTimeout(() => setCopyMessage(''), 1500)
    } catch {
      setCopyMessage('Không thể copy mã khay trên trình duyệt hiện tại.')
      window.setTimeout(() => setCopyMessage(''), 1500)
    }
  }

  if (auditQuery.isLoading) {
    return (
      <Stack spacing={1.2}>
        <Skeleton variant="rounded" height={88} />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
    )
  }

  if (auditQuery.isError) {
    return <Alert severity="error">Không tải được dữ liệu audit consistency của đơn hàng.</Alert>
  }

  if (!result) {
    return <Alert severity="info">Chưa có kết quả audit cho đơn hàng này.</Alert>
  }

  return (
    <Stack spacing={2}>
      {copyMessage && <Alert severity="success">{copyMessage}</Alert>}

      {/* Senior Handover: Audit is embedded in Order Detail. */}
      <AuditSummaryCard summary={result.summary} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
        }}
      >
        <AuditOrderSummarySection order={result.order_summary} onCopyOrderCode={handleCopyOrderCode} />
        <AuditPickingValidationSection data={result.picking_validation} />
      </Box>

      <AuditInventoryValidationSection data={result.inventory_validation} />
      <AuditIssuesSection issues={result.issues} />

      <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0' }}>
        <Stack spacing={1.2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
              Pick Logs (trong Audit)
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={showPickLogs ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowPickLogs((prev) => !prev)}
            >
              {showPickLogs ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </Stack>

          <Collapse in={showPickLogs}>
            <PickLogsTable
              rows={pickLogRowsForTable}
              isLoading={auditQuery.isFetching}
              isError={false}
              onCopyTrayCode={handleCopyTrayCode}
            />
          </Collapse>
        </Stack>
      </Paper>
    </Stack>
  )
}
