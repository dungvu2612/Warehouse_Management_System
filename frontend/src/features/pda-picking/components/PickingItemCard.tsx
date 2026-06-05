/*
- Mục đích: Card item picking thay cho table row tren Staff Picking Detail.
- Phụ thuộc: OrderDetailPickingTask type, PickingProgressBar.
- Giả định màn hình HT730: Mã/tên sản phẩm và số lượng còn lại phải vừa màn hình dọc 480px.
- Quy tắc responsive: One-column card, monospace codes, 48px select button.
- Luồng scanner: Select item before tray/product scan panel appears.
- Ghi chú bảo trì: Desktop order print is separate from PDA picking layout.
*/

import { Button, Chip, Paper, Stack, Typography } from '@mui/material'
import type { OrderDetailPickingTask } from '../../orders/types/orderTypes'
import { PickingProgressBar } from './PickingProgressBar'

interface PickingItemCardProps {
  task: OrderDetailPickingTask
  active: boolean
  onSelect: () => void
}

export function PickingItemCard({ task, active, onSelect }: PickingItemCardProps) {
  const remaining = Math.max(task.required_quantity - task.picked_quantity, 0)

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'rgba(25, 118, 210, 0.06)' : 'background.paper',
      }}
    >
      {/* Ghi chú: phần in đơn desktop tách riêng khỏi layout PDA picking */}
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 17 }} noWrap>
              {task.product_code}
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{task.product_name}</Typography>
          </Stack>
          <Chip
            size="small"
            color={task.status === 'DONE' ? 'success' : task.status === 'PICKING' ? 'secondary' : 'default'}
            label={task.status}
            sx={{ fontWeight: 900 }}
          />
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip label={`Cần ${task.required_quantity}`} sx={{ fontWeight: 800 }} />
          <Chip label={`Đã ${task.picked_quantity}`} sx={{ fontWeight: 800 }} />
          <Chip color={remaining > 0 ? 'warning' : 'success'} label={`Còn ${remaining}`} sx={{ fontWeight: 800 }} />
        </Stack>
        <Typography sx={{ fontSize: 15 }}>
          Khay cần: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 900 }}>{task.tray_code || '-'}</Typography>
        </Typography>
        <PickingProgressBar picked={task.picked_quantity} required={task.required_quantity} />
        <Button
          type="button"
          fullWidth
          variant={active ? 'contained' : 'outlined'}
          onClick={onSelect}
          disabled={task.status === 'DONE'}
          sx={{ minHeight: 48, fontSize: 15, fontWeight: 900 }}
        >
          {active ? 'Đang chọn' : 'Chọn nhặt'}
        </Button>
      </Stack>
    </Paper>
  )
}
