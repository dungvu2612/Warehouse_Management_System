import { AppBar, Box, Button, Container, Drawer, List, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../app/providers/AuthProvider'

// Chiều rộng sidebar trái.
const drawerWidth = 240

// Danh sách menu điều hướng chính của hệ thống.
const menuItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Products', path: '/products' },
  { label: 'Locations', path: '/locations' },
  { label: 'Trays', path: '/trays' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Import Receipts', path: '/import-receipts' },
  { label: 'BOM', path: '/boms' },
  { label: 'Orders', path: '/orders' },
  { label: 'Stock Transactions', path: '/stock-transactions' },
  { label: 'Pick Logs', path: '/pick-logs' },
  { label: 'Audit', path: '/audit/consistency' },
]

export function AppLayout() {
  // Lấy pathname để highlight menu đang active.
  const { pathname } = useLocation()
  // Lấy user + logout từ auth context.
  const { user, logout } = useAuth()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar cố định bên trái */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            WMS
          </Typography>
        </Toolbar>

        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={pathname === item.path}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Khối nội dung bên phải */}
      <Box sx={{ flexGrow: 1 }}>
        {/* Top bar */}
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e5e7eb' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">Warehouse Management System</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Hiển thị user đang đăng nhập */}
              <Typography variant="body2">{user?.username} ({user?.role})</Typography>

              {/* Logout: xóa session và về login */}
              <Button
                variant="outlined"
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
              >
                Logout
              </Button>
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
