/*
Mo ta file:
- Panel phu trach luong scan/confirm picking cua 1 order da chon.
- Component nay presentation + local form state, khong chua call API truc tiep.

Luong xu ly:
1) Hien thong tin order dang thao tac + progress + danh sach tasks.
2) Cho phep nhap tray_code va quantity de confirm tung task.
3) Day callback confirm picking ve page.
*/

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type {
  ConfirmPickingPayload,
  Order,
  OrderProgress,
  PickingTask,
} from '../types/orderTypes'

interface PickingPanelProps {
  order: Order | null
  tasks: PickingTask[]
  progress: OrderProgress | null
  isLoadingTasks: boolean
  canOperate: boolean
  confirmPending: boolean
  onConfirmTask: (taskId: number, payload: ConfirmPickingPayload) => void
}

export function PickingPanel({
  order,
  tasks,
  progress,
  isLoadingTasks,
  canOperate,
  confirmPending,
  onConfirmTask,
}: PickingPanelProps) {
  // Local state luu task dang thao tac + form confirm.
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  const [trayCode, setTrayCode] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState('')

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null
    return tasks.find((task) => task.id === activeTaskId) || null
  }, [activeTaskId, tasks])

  const progressValue = progress?.progress ?? 0

  const handleConfirm = () => {
    if (!activeTask) {
      setLocalError('Vui lòng chọn một picking task để xác nhận.')
      return
    }

    if (!trayCode.trim()) {
      setLocalError('Vui lòng nhập tray_code.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setLocalError('Số lượng xác nhận phải lớn hơn 0.')
      return
    }

    setLocalError('')
    onConfirmTask(activeTask.id, {
      tray_code: trayCode,
      quantity,
      note: note.trim(),
    })
  }

  if (!order) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Picking panel
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Chọn một order trong bảng để mở luồng picking.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            Picking order: {order.order_code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Khách hàng: {order.customer_name || '-'}
          </Typography>
        </Box>

        <Box>
          <Stack direction="row" sx={{ mb: 0.8, justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
              Tiến độ picking
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              {progress?.done_tasks ?? 0}/{progress?.total_tasks ?? tasks.length} ({progressValue}%)
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progressValue} sx={{ height: 8, borderRadius: 99 }} />
        </Box>

        {isLoadingTasks && <Alert severity="info">Đang tải tasks...</Alert>}

        <Stack spacing={1}>
          {tasks.length === 0 && !isLoadingTasks && (
            <Alert severity="warning">Order này chưa có picking task. Hãy scan order trước.</Alert>
          )}

          {tasks.map((task) => (
            <Button
              key={task.id}
              variant={activeTaskId === task.id ? 'contained' : 'outlined'}
              color={task.status === 'DONE' ? 'success' : 'primary'}
              onClick={() => {
                setActiveTaskId(task.id)
                setQuantity(Math.max(1, task.required_quantity - task.picked_quantity))
              }}
              sx={{ justifyContent: 'space-between', textTransform: 'none' }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  Task #{task.id} - Product #{task.product_id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tray #{task.tray_id} | Required: {task.required_quantity} | Picked: {task.picked_quantity}
                </Typography>
              </Box>
              <Chip size="small" label={task.status} color={task.status === 'DONE' ? 'success' : 'default'} />
            </Button>
          ))}
        </Stack>

        <Stack spacing={1.2}>
          <TextField
            label="Tray code"
            value={trayCode}
            onChange={(e) => setTrayCode(e.target.value)}
            placeholder="TRAY-XXX hoặc mã QR khay"
            fullWidth
            disabled={!canOperate || !activeTask}
          />
          <TextField
            label="Số lượng xác nhận"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            fullWidth
            disabled={!canOperate || !activeTask}
          />
          <TextField
            label="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            disabled={!canOperate || !activeTask}
          />
        </Stack>

        {localError && <Alert severity="error">{localError}</Alert>}

        <Button
          variant="contained"
          color="secondary"
          onClick={handleConfirm}
          disabled={!canOperate || !activeTask || confirmPending}
        >
          {confirmPending ? 'Đang xác nhận...' : 'Xác nhận picking task'}
        </Button>
      </Stack>
    </Paper>
  )
}
