/*
- Mục đích: Mobile card thay cho table row tren /staff/tasks.
- Phụ thuộc: StaffTaskItem type, MUI card primitives.
- Giả định màn hình HT730: Mã đơn và thao tác phải thấy rõ không cần zoom trên màn hình dọc 480x800.
- Quy tắc responsive: One card per order, no multi-column table, 48px primary button.
- Luồng scanner: Whole card and Start Picking both open picking detail.
- Ghi chú bảo trì: Giữ tóm tắt danh sách ngắn; chi tiết khách hàng/đơn đầy đủ nằm ở trang chi tiết.
*/

import { ArrowForward, PhoneOutlined } from '@mui/icons-material'
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import type { StaffTaskItem } from '../types/staffTasks.types'
import { formatDateVN } from '../../../shared/lib/datetime'

interface StaffOrderCardProps {
  item: StaffTaskItem
  onStart: (orderId: number) => void
  onClaim: (orderId: number) => void
  isClaiming?: boolean
}

const statusLabel: Record<string, string> = {
  WAITING: 'Chờ nhận',
  PICKING: 'Đang nhặt',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export function StaffOrderCard({ item, onStart, onClaim, isClaiming = false }: StaffOrderCardProps) {
  const progress = item.total_items > 0 ? Math.round((item.picked_items / item.total_items) * 100) : 0
  const isWaiting = item.status === 'WAITING' || !item.assigned_to

  return (
    <Paper
      variant="outlined"
      onClick={() => {
        if (!isWaiting) onStart(item.id)
      }}
      sx={{
        p: 1.5,
        borderRadius: 2,
        cursor: isWaiting ? 'default' : 'pointer',
        '&:active': { bgcolor: 'action.selected' },
      }}
    >
      {/* Ghi chú: PDA dùng layout dạng thẻ thay cho bảng desktop */}
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
              color={isWaiting ? 'warning' : 'secondary'}
              label={statusLabel[item.status] || item.status}
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
              Đã nhặt {item.picked_items}/{item.total_items}
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              {formatDateVN(item.created_at)}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.75, height: 8, borderRadius: 99 }} />
        </Box>

        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
          Phụ trách: {item.assignee_name || item.assignee_username || 'Chưa có người nhận'}
        </Typography>

        <Button
          type="button"
          fullWidth
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={(event) => {
            event.stopPropagation()
            if (isWaiting) {
              onClaim(item.id)
              return
            }
            onStart(item.id)
          }}
          disabled={isClaiming}
          sx={{ minHeight: 48, fontSize: 15, fontWeight: 900 }}
        >
          {isWaiting ? 'Nhận việc' : 'Tiếp tục nhặt'}
        </Button>
      </Stack>
    </Paper>
  )
}
