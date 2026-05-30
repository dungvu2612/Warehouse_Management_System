/*
Senior Handover Note:
- Purpose: Panel cho trang thai dang cho scan tren HT730.
- Dependencies: MUI Paper/Typography.
- HT730 screen assumptions: Staff reads this at arm length on a 4-inch screen.
- Responsive rules: Large text, no columns, icon-sized visual cue only.
- Scanner workflow: Used after pressing Scan Order/Tray/Product to focus hidden input.
- Maintenance notes: Keep copy short and operational.
*/

import { QrCodeScanner } from '@mui/icons-material'
import { Paper, Stack, Typography } from '@mui/material'

interface ScanWaitingPanelProps {
  title: string
  helper: string
  codeHint?: string
}

export function ScanWaitingPanel({ title, helper, codeHint }: ScanWaitingPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eef7ff' }}>
      <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <QrCodeScanner color="primary" sx={{ fontSize: 40 }} />
        <Typography sx={{ fontSize: 17, fontWeight: 900 }}>{title}</Typography>
        <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>{helper}</Typography>
        {codeHint && (
          <Typography sx={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900 }}>
            {codeHint}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}
