/*
Senior Handover Note:
- Purpose: Layout chung cua app, quan ly sidebar menu + topbar cho cac route private.
- Dependencies: React Router (`Outlet`, `RouterLink`) va auth context (`useAuth`).
- Maintenance notes: Khi bo sung/bo bot route nghiep vu, cap nhat menuItems tai day de tranh menu mo coi.
- API contract: Khong goi API truc tiep; chi hien thi thong tin user da co san trong auth context.
- Audit usage: Khong phuc vu audit truc tiep; chi dieu huong nguoi dung den cac man nghiep vu.
- HT730 screen assumptions: PDA/Staff routes render their own PdaLayout without desktop sidebar.
- Responsive rules: Desktop drawer remains for admin routes; PDA routes have zero horizontal chrome.
- Role policy: Staff/PDA menu entries are WAREHOUSE-only, not ADMIN shortcuts.
*/

import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  CategoryOutlined,
  HomeWorkOutlined,
  LocationOnOutlined,
  MapOutlined,
  QrCodeScannerOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
  WarehouseOutlined,
  PhoneAndroidOutlined,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../app/providers/AuthProvider'
import type { UserRole } from '../shared/types/auth'

// Chiều rộng sidebar trái.
const drawerWidth = 240

type MenuItem = {
  label: string
  path: string
  icon: SvgIconComponent
  roles: UserRole[]
}

// Danh sách menu điều hướng chính của hệ thống.
const menuItems: MenuItem[] = [
  { label: 'Tổng quan', path: '/dashboard', icon: HomeWorkOutlined, roles: ['ADMIN', 'WAREHOUSE', 'VIEWER'] },
  { label: 'Sản phẩm', path: '/products', icon: CategoryOutlined, roles: ['ADMIN'] },
  { label: 'Vị trí', path: '/locations', icon: LocationOnOutlined, roles: ['ADMIN'] },
  { label: 'Khay', path: '/trays', icon: MapOutlined, roles: ['ADMIN'] },
  { label: 'Kho tổng hợp', path: '/warehouse-overview', icon: WarehouseOutlined, roles: ['ADMIN', 'WAREHOUSE'] },
  { label: 'Phiếu nhập', path: '/import-receipts', icon: ReceiptLongOutlined, roles: ['ADMIN'] },
  { label: 'BOM', path: '/boms', icon: QrCodeScannerOutlined, roles: ['ADMIN'] },
  { label: 'Đơn hàng', path: '/orders', icon: ShoppingCartOutlined, roles: ['ADMIN', 'WAREHOUSE'] },
  // Senior Handover: replacement refactor, no duplicate picking flow.
  // Senior Handover: staff task list is the entry point for warehouse workers.
  { label: 'Tác vụ kho', path: '/staff/tasks', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Quét đơn (PDA)', path: '/pda/picking', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Kiểm kê (PDA)', path: '/pda/stocktaking', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Tra cứu (PDA)', path: '/pda/lookup', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
  { label: 'Nhập kho (PDA)', path: '/pda/putaway', icon: PhoneAndroidOutlined, roles: ['WAREHOUSE'] },
]

export function AppLayout() {
  // Lấy pathname để highlight menu đang active.
  const { pathname } = useLocation()
  // Lấy user + logout từ auth context.
  const { user, logout } = useAuth()
  const isPdaRoute = pathname.startsWith('/pda/') || pathname.startsWith('/staff/')
  const visibleMenuItems = menuItems.filter((item) => user?.role && item.roles.includes(user.role))

  if (isPdaRoute) {
    return <Outlet />
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar cố định bên trái */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
            color: 'white',
            borderRight: 'none',
          },
        }}
      >
        <Toolbar sx={{ bgcolor: 'primary.dark', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>
            WMS ENTERPRISE
          </Typography>
         
        </Toolbar>

        <Box sx={{ p: 2, borderBottom: '1px solid #1e293b' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
            {user?.full_name || user?.username}
          </Typography>
          <Chip
            size="small"
            label={user?.role || 'N/A'}
            color={user?.role === 'ADMIN' ? 'secondary' : 'success'}
            sx={{ mt: 1, fontSize: '10px', fontWeight: 800 }}
          />
        </Box>

        <List sx={{ p: 1.5 }}>
          {visibleMenuItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={pathname === item.path}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: pathname === item.path ? 'white' : 'grey.400',
                bgcolor: pathname === item.path ? 'secondary.main' : 'transparent',
                '&:hover': {
                  bgcolor: pathname === item.path ? 'secondary.dark' : 'rgba(255,255,255,0.06)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 35,
                  color: pathname === item.path ? 'white' : 'grey.400',
                }}
              >
                <item.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography sx={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</Typography>}
              />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ borderColor: '#1e293b', mb: 2 }} />
          <Button
            fullWidth
            variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            onClick={() => {
              logout()
              window.location.href = '/login'
            }}
          >
            Đăng xuất
          </Button>
        </Box>
      </Drawer>

      {/* Khối nội dung bên phải */}
      <Box sx={{ flexGrow: 1 }}>
        {/* Top bar */}
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              WMS Portal / {pathname.replace('/', '') || 'dashboard'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label={user?.username || 'Unknown'} size="small" color="secondary" />
              <Chip label={user?.role || 'N/A'} size="small" variant="outlined" />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Vùng render child route */}
        <Container sx={{ py: 3 }} maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
