import { Alert, Box, Button, Chip, List, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material'
import { Refresh } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationLevel } from '../types/notificationTypes'

const levelLabel: Record<NotificationLevel, string> = {
  INFO: 'Thông tin',
  WARNING: 'Cảnh báo',
  ERROR: 'Nghiêm trọng',
  SUCCESS: 'Hoàn thành',
}

const levelColor: Record<NotificationLevel, 'default' | 'warning' | 'error' | 'success' | 'info'> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function NotificationsPage() {
  const { token } = useAuth()
  const { items, unreadCount, connectionMessage, loadSummary, markRead, markAllRead } = useNotifications(token)

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Thông báo</Typography>
            <Typography color="text.secondary">Theo dõi các cảnh báo và sự kiện quan trọng trong kho</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => void loadSummary()}>
              Làm mới
            </Button>
            <Button variant="contained" onClick={() => void markAllRead()}>
              Đánh dấu đã xem
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {connectionMessage && <Alert severity="warning">{connectionMessage}</Alert>}

      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontWeight: 900 }}>
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo chưa đọc'}
          </Typography>
        </Box>
        {items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Chưa có thông báo</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((item) => (
              <ListItemButton
                key={item.id}
                component={item.link ? RouterLink : 'button'}
                to={item.link || undefined}
                onClick={() => markRead(item.id)}
                sx={{ alignItems: 'flex-start', py: 1.5, borderBottom: '1px solid #f1f5f9' }}
              >
                <ListItemText
                  primary={
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
                      <Typography sx={{ fontWeight: 900 }}>{item.title}</Typography>
                      <Chip size="small" color={levelColor[item.level]} label={levelLabel[item.level]} />
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography component="span" color="text.secondary">{item.message}</Typography>
                      <Typography component="span" color="text.disabled" sx={{ fontSize: 12 }}>{formatTime(item.created_at)}</Typography>
                    </Stack>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  )
}
