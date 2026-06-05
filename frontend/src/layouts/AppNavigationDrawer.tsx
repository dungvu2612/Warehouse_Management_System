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
import type { AuthUser, UserRole } from '../shared/types/auth'

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
  { label: 'Tác vụ kho', path: '/staff/tasks', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Quét đơn ', path: '/pda/picking', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Kiểm kê', path: '/pda/stocktaking', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Tra cứu', path: '/pda/lookup', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Nhập kho', path: '/pda/putaway', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
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
                  minWidth: collapsed ? 0 : 35,
                  color: selected ? 'white' : 'grey.400',
                  justifyContent: 'center',
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              {!collapsed && <ListItemText primary={<Typography sx={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</Typography>} />}
            </ListItemButton>
          )

          return (
            <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right">
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
