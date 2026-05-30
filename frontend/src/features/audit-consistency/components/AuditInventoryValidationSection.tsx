/*
Senior Handover Note:
- Purpose: Section C - doi soat inventory va stock transactions theo workflow xuat kho.
- Dependencies: Nhan `inventory_validation` tu adapter normalize.
- Audit logic: Chi render before/after + matched flags, khong map issue tai component.
- API assumptions: Neu thieu field backend, component hien fallback text theo contract.
- Maintenance notes: Table nay uu tien compact de supervisor soi nhanh sai lech.
*/

import { Alert, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import type { AuditInventoryValidation } from '../types/auditConsistencyTypes'

interface AuditInventoryValidationSectionProps {
  data: AuditInventoryValidation
}

function formatBool(value: boolean | null) {
  if (value === null) return 'Data not provided by backend'
  return value ? 'YES' : 'NO'
}

export function AuditInventoryValidationSection({ data }: AuditInventoryValidationSectionProps) {
  return (
    <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0' }}>
      <Stack spacing={1.2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          C. Inventory Validation
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip label={`inventory deducted correctly: ${formatBool(data.inventory_deducted_correctly)}`} />
          <Chip label={`stock transaction matched: ${formatBool(data.stock_transaction_matched)}`} />
          <Chip color="secondary" label={`pick total: ${data.pick_logs_total_qty}`} />
          <Chip color="secondary" label={`export total: ${data.export_tx_total_qty}`} />
        </Stack>

        {data.fallback_note && <Alert severity="info">{data.fallback_note}</Alert>}

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Khay</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Before</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>After</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Inventory hiện tại</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Picked</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Export Tx</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.before_after_rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>Data not provided by backend</TableCell>
                </TableRow>
              )}

              {data.before_after_rows.map((row) => (
                <TableRow key={row.key} hover>
                  <TableCell>{row.product_code} - {row.product_name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{row.tray_code}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{row.before_quantity ?? 'Data not provided by backend'}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{row.after_quantity ?? 'Data not provided by backend'}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{row.current_inventory_quantity ?? 'Data not provided by backend'}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{row.picked_quantity}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{row.export_quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  )
}
