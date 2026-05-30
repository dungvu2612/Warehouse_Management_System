/*
Senior Handover Note:
- Purpose: Success/error feedback panel readable on HT730.
- Dependencies: MUI Alert.
- HT730 screen assumptions: Scan feedback must be readable on a 4-inch screen.
- Responsive rules: One message per panel, 15px text minimum, no color-only status.
- Scanner workflow: Display after every scan success/error.
- Maintenance notes: Include concrete expected/scanned codes for mismatch errors.
*/

import { Alert, Typography } from '@mui/material'

interface ScanResultPanelProps {
  severity: 'success' | 'info' | 'warning' | 'error'
  title: string
  message?: string
}

export function ScanResultPanel({ severity, title, message }: ScanResultPanelProps) {
  return (
    // Senior Handover: scan feedback must be readable on a 4-inch screen
    <Alert severity={severity} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
      <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{title}</Typography>
      {message && <Typography sx={{ fontSize: 14 }}>{message}</Typography>}
    </Alert>
  )
}
