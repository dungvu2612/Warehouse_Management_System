import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { NotificationsOutlined } from '@mui/icons-material'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationItem, NotificationLevel } from '../types/notificationTypes'

const levelColor: Record<NotificationLevel, string> = {
  INFO: '#2563eb',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  SUCCESS: '#10b981',
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function NotificationRow({ item, onClick }: { item: NotificationItem; onClick: () => void }) {
  const content = (
    <ListItemButton
      component={item.link ? RouterLink : 'button'}
      to={item.link || undefined}
      onClick={onClick}
      sx={{ alignItems: 'flex-start', gap: 1.2, py: 1.25 }}
    >
      <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: 99, bgcolor: levelColor[item.level] || levelColor.INFO, flexShrink: 0 }} />
      <ListItemText
        primary={
          <Typography sx={{ fontSize: 13, fontWeight: 900, color: 'text.primary' }}>
            {item.title}
          </Typography>
        }
        secondary={
          <Stack spacing={0.25}>
            <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
              {item.message}
            </Typography>
            <Typography component="span" sx={{ fontSize: 11, color: 'text.disabled' }}>
              {formatTime(item.created_at)}
            </Typography>
          </Stack>
        }
      />
    </ListItemButton>
  )

  return content
}

export function NotificationBell({ token }: { token: string | null }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const {
    items,
    unreadCount,
    connectionMessage,
    latestItem,
    markRead,
    markAllRead,
    dismissLatest,
  } = useNotifications(token)
  const open = Boolean(anchorEl)

  const close = () => setAnchorEl(null)

  return (
    <>
      <Tooltip title="Thông báo">
        <IconButton color="inherit" onClick={(event) => setAnchorEl(event.currentTarget)} aria-label="Thông báo">
          <Badge color="error" badgeContent={unreadCount} max={99}>
            <NotificationsOutlined />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: { xs: 320, sm: 390 }, maxWidth: 'calc(100vw - 24px)' } } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Thông báo</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Không có thông báo chưa đọc'}
              </Typography>
            </Box>
            <Button size="small" onClick={() => void markAllRead()}>
              Đánh dấu đã xem
            </Button>
          </Stack>
          {connectionMessage && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              {connectionMessage}
            </Alert>
          )}
        </Box>
        <Divider />
        <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Chưa có thông báo</Typography>
            </Box>
          ) : (
            items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onClick={() => {
                  markRead(item.id)
                  close()
                }}
              />
            ))
          )}
        </List>
        <Divider />
        <Box sx={{ p: 1.5, textAlign: 'right' }}>
          <Button size="small" component={RouterLink} to="/notifications" onClick={close}>
            Xem tất cả
          </Button>
        </Box>
      </Popover>

      <Snackbar
        open={Boolean(latestItem)}
        autoHideDuration={3500}
        onClose={dismissLatest}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={latestItem?.level === 'ERROR' ? 'error' : latestItem?.level === 'WARNING' ? 'warning' : latestItem?.level === 'SUCCESS' ? 'success' : 'info'} onClose={dismissLatest}>
          <strong>{latestItem?.title}</strong>
          <br />
          {latestItem?.message}
        </Alert>
      </Snackbar>
    </>
  )
}
