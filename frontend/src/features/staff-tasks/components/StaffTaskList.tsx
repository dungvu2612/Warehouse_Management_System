/*
- Mục đích: List wrapper cho staff tasks cards.
- Phụ thuộc: StaffOrderCard.
- Hợp đồng API: Render du lieu staff task da fetch.
- Quy tắc nghiệp vụ: Danh sách đơn cần nhặt là điểm vào thao tác kho.
- Ghi chú refactor thay thế: replacement refactor, no duplicate picking flow.
- Ghi chú luồng scanner: moi card dan staff vao picking detail scan-based.
- Ghi chú phân quyền: Dung cho ADMIN/WAREHOUSE.
- Giả định màn hình HT730: 480x800 portrait, list must stay one-column with large touch targets.
- Quy tắc responsive: Card list on PDA, desktop may widen but still avoids table for staff tasks.
- Ghi chú bảo trì: Neu can pagination sau nay, bo sung tai component nay.
*/

import { Alert, Box, Skeleton, Stack } from '@mui/material'
import type { StaffTaskItem } from '../types/staffTasks.types'
import { StaffOrderCard } from './StaffOrderCard'

interface StaffTaskListProps {
  items: StaffTaskItem[]
  isLoading: boolean
  isError: boolean
  onStart: (orderId: number) => void
  onClaim: (orderId: number) => void
  claimingOrderId?: number | null
  emptyText?: string
}

export function StaffTaskList({ items, isLoading, isError, onStart, onClaim, claimingOrderId = null, emptyText = 'Không có đơn cần nhặt' }: StaffTaskListProps) {
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
  if (items.length === 0) return <Alert severity="info">{emptyText}</Alert>

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 1.2,
        overflowX: 'hidden',
      }}
    >
      {/* Ghi chú: danh sách tác vụ staff là điểm vào cho nhân viên kho */}
      {items.map((item) => (
        <StaffOrderCard
          key={item.id}
          item={item}
          onStart={onStart}
          onClaim={onClaim}
          isClaiming={claimingOrderId === item.id}
        />
      ))}
    </Box>
  )
}
