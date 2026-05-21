import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { PagePlaceholder } from '../pages/Placeholders'
import { PrivateRoute, PublicRoute } from '../shared/router/guards'

// Cấu hình toàn bộ route của app.
export const router = createBrowserRouter([
  {
    // Route public cho màn login.
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    // Nhóm route private dùng chung AppLayout.
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      // Vào root thì tự chuyển sang dashboard.
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Các route nghiệp vụ (tạm placeholder, sẽ thay bằng page thật ở phần tiếp theo).
      { path: 'dashboard', element: <PagePlaceholder title="Dashboard" /> },
      { path: 'products', element: <PagePlaceholder title="Products" /> },
      { path: 'locations', element: <PagePlaceholder title="Locations" /> },
      { path: 'trays', element: <PagePlaceholder title="Trays" /> },
      { path: 'inventory', element: <PagePlaceholder title="Inventory" /> },
      { path: 'import-receipts', element: <PagePlaceholder title="Import Receipts" /> },
      { path: 'boms', element: <PagePlaceholder title="BOM" /> },
      { path: 'orders', element: <PagePlaceholder title="Orders" /> },
      { path: 'orders/:id', element: <PagePlaceholder title="Order Detail" /> },
      { path: 'stock-transactions', element: <PagePlaceholder title="Stock Transactions" /> },
      { path: 'pick-logs', element: <PagePlaceholder title="Pick Logs" /> },
      { path: 'audit/consistency', element: <PagePlaceholder title="Audit Consistency" /> },
      { path: 'forbidden', element: <PagePlaceholder title="Forbidden" /> },
    ],
  },
  {
    // Route fallback: đường dẫn không hợp lệ -> về login.
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
