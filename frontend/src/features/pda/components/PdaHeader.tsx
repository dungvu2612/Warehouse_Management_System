/*
- Mục đích: Header compact cho PDA routes.
- Phụ thuộc: MUI chips/typography.
- Giả định màn hình HT730: Header cần giữ trong khoảng 48-56px để nội dung còn đủ vùng hiển thị.
- Quy tắc responsive: Single row, truncated text, no breadcrumb/sidebar.
- Luồng scanner: Shows role and connection status while scanner flow remains in content.
- Ghi chú bảo trì: Keep text short; long route labels reduce usable scan area.
*/

import { MenuOutlined } from '@mui/icons-material'
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material'

interface PdaHeaderProps {
  title: string
  subtitle?: string
  role: string
  username: string
  onOpenMenu?: () => void
}

export function PdaHeader({ title, subtitle, role, username, onOpenMenu }: PdaHeaderProps) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          {onOpenMenu && (
            <IconButton
              aria-label="Mở menu"
              onClick={onOpenMenu}
              size="small"
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
              }}
            >
              <MenuOutlined fontSize="small" />
            </IconButton>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 900, lineHeight: 1.15 }} noWrap>
              {title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.15 }} noWrap>
              {subtitle || username || 'WMS PDA'}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Chip size="small" color={navigator.onLine ? 'success' : 'default'} label={navigator.onLine ? 'ON' : 'OFF'} />
          <Chip size="small" color={role === 'ADMIN' ? 'secondary' : 'primary'} label={role} />
        </Stack>
      </Stack>
    </Box>
  )
}
