/*
Senior Handover Note:
- Purpose: Modal scan tray QR de dieu chinh ton kho nhanh cho Staff/Admin.
- Dependencies: Inventory hooks/service do page truyen vao qua callbacks.
- API contract: GET /trays/scan/:qr_code, POST /inventory/adjust-by-tray.
- Business rules: tray QR la operational identifier, modal auto fill tray/product/current qty truoc khi adjust.
- Permission notes: VIEWER khong co quyen submit adjust.
- Maintenance notes: Component nay chi render + emit events, khong goi API truc tiep.
*/

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { InventoryTrayScanResponse } from '../types/inventoryTypes'

interface InventoryAdjustByQrModalProps {
  open: boolean
  trayQRCode: string
  delta: number
  note: string
  scanData: InventoryTrayScanResponse | null
  scanLoading: boolean
  submitLoading: boolean
  errorMessage: string
  onClose: () => void
  onChangeTrayQRCode: (value: string) => void
  onChangeDelta: (value: number) => void
  onChangeNote: (value: string) => void
  onScanTray: () => void
  onSubmitAdjust: () => void
}

export function InventoryAdjustByQrModal({
  open,
  trayQRCode,
  delta,
  note,
  scanData,
  scanLoading,
  submitLoading,
  errorMessage,
  onClose,
  onChangeTrayQRCode,
  onChangeDelta,
  onChangeNote,
  onScanTray,
  onSubmitAdjust,
}: InventoryAdjustByQrModalProps) {
  const firstInventory = scanData?.inventory_items?.[0]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Scan Tray để điều chỉnh</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <TextField
            autoFocus
            label="Tray QR"
            value={trayQRCode}
            onChange={(e) => onChangeTrayQRCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onScanTray()
              }
            }}
            fullWidth
          />

          <Button variant="outlined" onClick={onScanTray} disabled={scanLoading}>
            {scanLoading ? 'Đang scan...' : 'Scan tray'}
          </Button>

          {scanData && (
            <Stack spacing={0.4}>
              {/* Senior Handover: tray QR is operational identifier */}
              <Typography><strong>Tray:</strong> {scanData.tray.tray_code}</Typography>
              <Typography><strong>Location:</strong> {scanData.location_code || '-'}</Typography>
              <Typography><strong>Product:</strong> {firstInventory?.product_code || '-'} - {firstInventory?.product_name || '-'}</Typography>
              <Typography><strong>Current qty:</strong> {scanData.inventory_total}</Typography>
            </Stack>
          )}

          <TextField
            label="Delta điều chỉnh (+/-)"
            type="number"
            value={delta}
            onChange={(e) => onChangeDelta(Number(e.target.value) || 0)}
            fullWidth
          />

          <TextField
            label="Ghi chú"
            value={note}
            onChange={(e) => onChangeNote(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={onSubmitAdjust} disabled={submitLoading || !scanData}>
          {submitLoading ? 'Đang điều chỉnh...' : 'Xác nhận điều chỉnh'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
