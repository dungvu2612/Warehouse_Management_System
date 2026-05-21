import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'

// Query client dùng chung cho toàn app React Query.
const queryClient = new QueryClient()

// Theme MUI cơ bản cho dự án WMS.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
    },
    secondary: {
      main: '#2e7d32',
    },
    background: {
      default: '#f5f7fb',
    },
  },
  shape: {
    borderRadius: 10,
  },
})

// Provider tổng: nơi bọc tất cả provider nền của ứng dụng.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* Reset CSS base của trình duyệt theo chuẩn MUI */}
        <CssBaseline />
        {/* AuthProvider bọc dưới để mọi màn/router guard đọc được auth state */}
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
