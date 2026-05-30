/*
Senior Handover Note:
- Purpose: Header compact cho PDA routes.
- Dependencies: MUI chips/typography.
- HT730 screen assumptions: Header must stay within 48-56px so content remains visible.
- Responsive rules: Single row, truncated text, no breadcrumb/sidebar.
- Scanner workflow: Shows role and connection status while scanner flow remains in content.
- Maintenance notes: Keep text short; long route labels reduce usable scan area.
*/

import { Box, Chip, Stack, Typography } from '@mui/material'

interface PdaHeaderProps {
  title: string
  subtitle?: string
  role: string
  username: string
}

export function PdaHeader({ title, subtitle, role, username }: PdaHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        minHeight: 52,
        maxHeight: 56,
        px: 1.5,
        py: 0.75,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 900, lineHeight: 1.15 }} noWrap>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.15 }} noWrap>
            {subtitle || username || 'WMS PDA'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Chip size="small" color={navigator.onLine ? 'success' : 'default'} label={navigator.onLine ? 'ON' : 'OFF'} />
          <Chip size="small" color={role === 'ADMIN' ? 'secondary' : 'primary'} label={role} />
        </Stack>
      </Stack>
    </Box>
  )
}
