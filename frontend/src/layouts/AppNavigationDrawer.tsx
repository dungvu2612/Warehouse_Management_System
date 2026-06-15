import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  CategoryOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  HomeWorkOutlined,
  LocationOnOutlined,
  LogoutOutlined,
  MapOutlined,
  PhoneAndroidOutlined,
  QrCodeScannerOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
  SupervisedUserCircleOutlined,
  WarehouseOutlined,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AuthUser, UserRole } from '../shared/types/auth'
import { staffTasksApi } from '../features/staff-tasks/api/staffTasks.api'

export const appDrawerWidth = 240
export const appDrawerCollapsedWidth = 72

type MenuItem = {
  label: string
  path: string
  icon: SvgIconComponent
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  { label: 'Tổng quan', path: '/dashboard', icon: HomeWorkOutlined, roles: ['ADMIN', 'WAREHOUSE'] },
  { label: 'Sản phẩm', path: '/products', icon: CategoryOutlined, roles: ['ADMIN'] },
  { label: 'Vị trí', path: '/locations', icon: LocationOnOutlined, roles: ['ADMIN'] },
  { label: 'Khay', path: '/trays', icon: MapOutlined, roles: ['ADMIN'] },
  { label: 'Kho tổng hợp', path: '/warehouse-overview', icon: WarehouseOutlined, roles: ['ADMIN', 'WAREHOUSE'] },
  { label: 'Phiếu nhập', path: '/import-receipts', icon: ReceiptLongOutlined, roles: ['ADMIN'] },
  { label: 'Phân rã sản phẩm', path: '/boms', icon: QrCodeScannerOutlined, roles: ['ADMIN'] },
  { label: 'Đơn hàng', path: '/orders', icon: ShoppingCartOutlined, roles: ['ADMIN'] },
  { label: 'Quản lý tài khoản', path: '/users', icon: SupervisedUserCircleOutlined, roles: ['ADMIN'] },
  { label: 'Tác vụ nhặt', path: '/staff/tasks', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Tác vụ nhập kho', path: '/staff/import-tasks', icon: ReceiptLongOutlined, roles: ['WAREHOUSE'] },
  { label: 'Quét đơn ', path: '/pda/picking', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Kiểm kê', path: '/pda/stocktaking', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Tra cứu', path: '/pda/lookup', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
]

interface AppNavigationDrawerProps {
  pathname: string
  user: AuthUser | null
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onNavigate?: () => void
  onLogout: () => void
}

export function AppNavigationDrawer({
  pathname,
  user,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
  onLogout,
}: AppNavigationDrawerProps) {
  const visibleMenuItems = menuItems.filter((item) => user?.role && item.roles.includes(user.role))
  const taskSummaryQuery = useQuery({
    queryKey: ['staff-task-summary'],
    queryFn: staffTasksApi.getSummary,
    enabled: Boolean(user?.role),
    staleTime: 15000,
  })
  const taskSummary = taskSummaryQuery.data
  const pickingWaitingCount = Number(taskSummary?.picking_waiting_count ?? taskSummary?.waiting_count ?? 0)
  const pickingCount = Number(taskSummary?.picking_in_progress_count ?? taskSummary?.my_picking_count ?? 0)
  const importWaitingCount = Number(taskSummary?.import_waiting_count || 0)
  const importProgressCount = Number(taskSummary?.import_in_progress_count || 0)

  return (
    <>
      <Toolbar
        sx={{
          bgcolor: 'primary.dark',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 1,
          px: collapsed ? 1 : 2,
          py: 1.5,
          minHeight: 64,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1, display: collapsed ? 'none' : 'block' }}>
          WMS System
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1, display: collapsed ? 'block' : 'none' }}>
          W
        </Typography>
        {onToggleCollapsed && (
          <Tooltip title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} placement="right">
            <IconButton
              aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              onClick={onToggleCollapsed}
              sx={{
                color: 'white',
                display: { xs: 'none', lg: 'inline-flex' },
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
              }}
              size="small"
            >
              {collapsed ? <ChevronRightOutlined fontSize="small" /> : <ChevronLeftOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      <Box sx={{ p: collapsed ? 1 : 2, borderBottom: '1px solid #1e293b', textAlign: collapsed ? 'center' : 'left' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'white', display: collapsed ? 'none' : 'block' }}>
          {user?.full_name || user?.username}
        </Typography>
        <Chip
          size="small"
          label={collapsed ? (user?.role || 'N/A').slice(0, 1) : user?.role || 'N/A'}
          color={user?.role === 'ADMIN' ? 'secondary' : 'success'}
          sx={{ mt: collapsed ? 0 : 1, fontSize: '10px', fontWeight: 800 }}
        />
      </Box>

      <List sx={{ p: collapsed ? 1 : 1.5 }}>
        {visibleMenuItems.map((item) => {
          const selected = pathname === item.path
          const Icon = item.icon
          const isPickingTaskMenu = item.path === '/staff/tasks'
          const isImportTaskMenu = item.path === '/staff/import-tasks'
          const waitingCount = isImportTaskMenu ? importWaitingCount : pickingWaitingCount
          const inProgressCount = isImportTaskMenu ? importProgressCount : pickingCount
          const tooltipText = isPickingTaskMenu || isImportTaskMenu
            ? `${item.label} - ${waitingCount} chờ nhận, ${inProgressCount} đang làm`
            : item.label
          const button = (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 1.5,
                color: selected ? 'white' : 'grey.400',
                bgcolor: selected ? 'secondary.main' : 'transparent',
                '&:hover': {
                  bgcolor: selected ? 'secondary.dark' : 'rgba(255,255,255,0.06)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  position: 'relative',
                  minWidth: collapsed ? 0 : 35,
                  color: selected ? 'white' : 'grey.400',
                  justifyContent: 'center',
                }}
              >
                <Icon fontSize="small" />
                {(isPickingTaskMenu || isImportTaskMenu) && collapsed && (waitingCount > 0 || inProgressCount > 0) && (
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      top: -5,
                      right: -8,
                      minWidth: 18,
                      height: 18,
                      px: 0.4,
                      borderRadius: 99,
                      bgcolor: waitingCount > 0 ? 'warning.main' : 'info.main',
                      color: waitingCount > 0 ? 'warning.contrastText' : 'info.contrastText',
                      fontSize: 11,
                      fontWeight: 900,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {waitingCount + inProgressCount}
                  </Box>
                )}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, flex: 1 }} noWrap>{item.label}</Typography>
                      {(isPickingTaskMenu || isImportTaskMenu) && waitingCount > 0 && (
                        <Chip size="small" color="warning" label={waitingCount} sx={{ height: 20, fontSize: 11, fontWeight: 900 }} />
                      )}
                      {(isPickingTaskMenu || isImportTaskMenu) && inProgressCount > 0 && (
                        <Chip size="small" color="info" label={inProgressCount} sx={{ height: 20, fontSize: 11, fontWeight: 900 }} />
                      )}
                    </Box>
                  }
                />
              )}
            </ListItemButton>
          )

          return (
            <Tooltip key={item.path} title={collapsed ? tooltipText : ''} placement="right">
              {button}
            </Tooltip>
          )
        })}
      </List>

      <Box sx={{ mt: 'auto', p: collapsed ? 1 : 2 }}>
        <Divider sx={{ borderColor: '#1e293b', mb: 2 }} />
        {collapsed ? (
          <Tooltip title="Đăng xuất" placement="right">
            <IconButton
              aria-label="Đăng xuất"
              onClick={onLogout}
              sx={{ color: 'white', width: '100%', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2 }}
            >
              <LogoutOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutOutlined />}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            onClick={onLogout}
          >
            Đăng xuất
          </Button>
        )}
      </Box>
    </>
  )
}
