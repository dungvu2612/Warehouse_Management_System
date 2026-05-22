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
  AssessmentOutlined,
  CategoryOutlined,
  HistoryOutlined,
  HomeWorkOutlined,
  Inventory2Outlined,
  LocationOnOutlined,
  MapOutlined,
  QrCodeScannerOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../app/providers/AuthProvider'

// Chiều rộng sidebar trái.
const drawerWidth = 240

type MenuItem = {
  label: string
  path: string
  icon: SvgIconComponent
}

// Danh sách menu điều hướng chính của hệ thống.
const menuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: HomeWorkOutlined },
  { label: 'Products', path: '/products', icon: CategoryOutlined },
  { label: 'Locations', path: '/locations', icon: LocationOnOutlined },
  { label: 'Trays', path: '/trays', icon: MapOutlined },
  { label: 'Inventory', path: '/inventory', icon: Inventory2Outlined },
  { label: 'Import Receipts', path: '/import-receipts', icon: ReceiptLongOutlined },
  { label: 'BOM', path: '/boms', icon: QrCodeScannerOutlined },
  { label: 'Orders', path: '/orders', icon: ShoppingCartOutlined },
  { label: 'Stock Transactions', path: '/stock-transactions', icon: HistoryOutlined },
  { label: 'Pick Logs', path: '/pick-logs', icon: HistoryOutlined },
  { label: 'Audit', path: '/audit/consistency', icon: AssessmentOutlined },
]

export function AppLayout() {
  // Lấy pathname để highlight menu đang active.
  const { pathname } = useLocation()
  // Lấy user + logout từ auth context.
  const { user, logout } = useAuth()

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
          {menuItems.map((item) => (
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
            Logout
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
