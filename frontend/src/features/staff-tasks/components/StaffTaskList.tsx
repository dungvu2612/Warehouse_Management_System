/*
Senior Handover Note:
- Purpose: List wrapper cho staff tasks cards.
- Dependencies: StaffOrderCard.
- API contract: Render du lieu staff task da fetch.
- Business rules: Danh sach don can nhat la entry point thao tac kho.
- Replacement refactor notes: replacement refactor, no duplicate picking flow.
- Scanner workflow notes: moi card dan staff vao picking detail scan-based.
- Permission notes: Dung cho ADMIN/WAREHOUSE.
- HT730 screen assumptions: 480x800 portrait, list must stay one-column with large touch targets.
- Responsive rules: Card list on PDA, desktop may widen but still avoids table for staff tasks.
- Maintenance notes: Neu can pagination sau nay, bo sung tai component nay.
*/

import { Alert, Box, Skeleton, Stack } from '@mui/material'
import type { StaffTaskItem } from '../types/staffTasks.types'
import { StaffOrderCard } from './StaffOrderCard'

interface StaffTaskListProps {
  items: StaffTaskItem[]
  isLoading: boolean
  isError: boolean
  onStart: (orderId: number) => void
}

export function StaffTaskList({ items, isLoading, isError, onStart }: StaffTaskListProps) {
  if (isLoading) {
    return (
      <Stack spacing={1}>
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} variant="rounded" height={168} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    )
  }
  if (isError) return <Alert severity="error">Không tải được danh sách công việc.</Alert>
  if (items.length === 0) return <Alert severity="info">Không có đơn cần nhặt</Alert>

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 1.2,
        overflowX: 'hidden',
      }}
    >
      {/* Senior Handover: staff task list is the entry point for warehouse workers */}
      {items.map((item) => (
        <StaffOrderCard key={item.id} item={item} onStart={onStart} />
      ))}
    </Box>
  )
}
