/*
Senior Handover Note:
- Purpose: Mobile card thay cho table row tren /staff/tasks.
- Dependencies: StaffTaskItem type, MUI card primitives.
- HT730 screen assumptions: Order code and action are visible without zoom on 480x800 portrait.
- Responsive rules: One card per order, no multi-column table, 48px primary button.
- Scanner workflow: Whole card and Start Picking both open picking detail.
- Maintenance notes: Keep list summary short; full customer/order details live in detail page.
*/

import { ArrowForward, PhoneOutlined } from '@mui/icons-material'
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import type { StaffTaskItem } from '../types/staffTasks.types'

interface StaffOrderCardProps {
  item: StaffTaskItem
  onStart: (orderId: number) => void
}

export function StaffOrderCard({ item, onStart }: StaffOrderCardProps) {
  const progress = item.total_items > 0 ? Math.round((item.picked_items / item.total_items) * 100) : 0

  return (
    <Paper
      variant="outlined"
      onClick={() => onStart(item.id)}
      sx={{
        p: 1.5,
        borderRadius: 2,
        cursor: 'pointer',
        '&:active': { bgcolor: 'action.selected' },
      }}
    >
      {/* Senior Handover: PDA routes use card layout instead of desktop tables */}
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 18, lineHeight: 1.2 }} noWrap>
              {item.order_code}
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 800 }} noWrap>
              {item.customer_name || '-'}
            </Typography>
          </Box>
          <Chip
            size="small"
            color={item.status === 'PENDING' ? 'warning' : 'secondary'}
            label={item.status}
            sx={{ fontWeight: 900 }}
          />
        </Stack>

        {item.customer_phone && (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <PhoneOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 15 }}>{item.customer_phone}</Typography>
          </Stack>
        )}

        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
              Items {item.picked_items}/{item.total_items}
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              {new Date(item.created_at).toLocaleDateString('vi-VN')}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.75, height: 8, borderRadius: 99 }} />
        </Box>

        <Button
          type="button"
          fullWidth
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={(event) => {
            event.stopPropagation()
            onStart(item.id)
          }}
          sx={{ minHeight: 48, fontSize: 15, fontWeight: 900 }}
        >
          Start Picking
        </Button>
      </Stack>
    </Paper>
  )
}
