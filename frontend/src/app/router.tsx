import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { DashboardMock, PagePlaceholder } from '../pages/Placeholders'
import { PrivateRoute, PublicRoute } from '../shared/router/guards'
import { ProductsPage } from '../features/products/pages/ProductsPage'
import { BOMsPage } from '../features/boms/pages/BOMsPage'
import { OrdersPage } from '../features/orders/pages/OrdersPage'
import { OrderDetail } from '../features/orders/pages/OrderDetail'

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

      // Các route nghiệp vụ.
      { path: 'dashboard', element: <DashboardMock /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'locations', element: <PagePlaceholder title="Locations" /> },
      { path: 'trays', element: <PagePlaceholder title="Trays" /> },
      { path: 'inventory', element: <PagePlaceholder title="Inventory" /> },
      { path: 'import-receipts', element: <PagePlaceholder title="Import Receipts" /> },
      { path: 'boms', element: <BOMsPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetail /> },
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
