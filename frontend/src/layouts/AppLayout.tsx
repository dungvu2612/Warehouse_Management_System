/*
Layout chung cho các route private: sidebar, topbar và outlet.
Route PDA/Staff dùng layout riêng nên không render khung desktop.
*/

import {
  AppBar,
  Box,
  Chip,
  Container,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { MenuOutlined } from '@mui/icons-material'
import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../app/providers/AuthProvider'
import { AppNavigationDrawer, appDrawerCollapsedWidth, appDrawerWidth } from './AppNavigationDrawer'

const sidebarCollapsedStorageKey = 'wms_sidebar_collapsed'

export function AppLayout() {
  // Lấy pathname để highlight menu đang active.
  const { pathname } = useLocation()
  // Lấy user + logout từ auth context.
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isTabletOrBelow = useMediaQuery(theme.breakpoints.down('lg'))
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(sidebarCollapsedStorageKey) === 'true')
  const isPdaRoute = pathname.startsWith('/pda/') || pathname.startsWith('/staff/')

  if (isPdaRoute) {
    return <Outlet />
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current
      localStorage.setItem(sidebarCollapsedStorageKey, String(next))
      return next
    })
  }

  const currentDrawerWidth = sidebarCollapsed ? appDrawerCollapsedWidth : appDrawerWidth

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', bgcolor: 'background.default' }}>
      {/* Sidebar desktop; tablet/android dùng drawer trượt để giữ nội dung đủ rộng. */}
      <Drawer
        variant={isTabletOrBelow ? 'temporary' : 'permanent'}
        open={isTabletOrBelow ? mobileDrawerOpen : true}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isTabletOrBelow ? 0 : currentDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isTabletOrBelow ? appDrawerWidth : currentDrawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
            color: 'white',
            borderRight: 'none',
            display: 'flex',
            transition: 'width 200ms ease',
            overflowX: 'hidden',
          },
        }}
      >
        <AppNavigationDrawer
          pathname={pathname}
          user={user}
          collapsed={!isTabletOrBelow && sidebarCollapsed}
          onToggleCollapsed={isTabletOrBelow ? undefined : handleToggleSidebar}
          onNavigate={() => setMobileDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </Drawer>

      {/* Khối nội dung bên phải */}
      <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%', maxWidth: '100vw' }}>
        {/* Top bar */}
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, minHeight: { xs: 56, md: 64 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              {isTabletOrBelow && (
                <IconButton
                  aria-label="Mở menu"
                  onClick={() => setMobileDrawerOpen(true)}
                  sx={{ flexShrink: 0 }}
                >
                  <MenuOutlined />
                </IconButton>
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 800, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                WMS Portal / {pathname.replace('/', '') || 'dashboard'}
              </Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Chip label={user?.username || 'Unknown'} size="small" color="secondary" />
              <Chip label={user?.role || 'N/A'} size="small" variant="outlined" />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Vùng render child route */}
        <Container sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: '100%', overflowX: 'hidden' }} maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
