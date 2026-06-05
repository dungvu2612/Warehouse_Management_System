/*
Router chính của ứng dụng.
Khai báo route theo module, không đặt logic nghiệp vụ ở đây.
*/

import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { PagePlaceholder } from '../pages/Placeholders'
import { PrivateRoute, PublicRoute, RoleRoute } from '../shared/router/guards'
import { ProductsPage } from '../features/products/pages/ProductsPage'
import { BOMsPage } from '../features/boms/pages/BOMsPage'
import { OrdersPage } from '../features/orders/pages/OrdersPage'
import { OrderDetail } from '../features/orders/pages/OrderDetail'
import { OrderEditPage } from '../features/orders/pages/OrderEditPage'
import { LocationsPage } from '../features/locations/pages/LocationsPage'
import { TraysPage } from '../features/trays/pages/TraysPage'
import { ImportReceiptsPage } from '../features/import-receipts/pages/ImportReceiptsPage'
import { WarehouseOverviewPage } from '../features/warehouse-overview/pages/WarehouseOverviewPage'
import { PDAPickingPage } from '../features/pda-picking/pages/PDAPickingPage'
import { PDAStocktakingPage } from '../features/pda-stocktaking/pages/PDAStocktakingPage'
import { PDAProductLookupPage } from '../features/pda-product-lookup/pages/PDAProductLookupPage'
import { PDAPutawayPage } from '../features/pda-putaway/pages/PDAPutawayPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { StaffTasksPage } from '../features/staff-tasks/pages/StaffTasksPage'
import { StaffPickingDetailPage } from '../features/pda-picking/pages/StaffPickingDetailPage'
import { UserManagementPage } from '../features/users/pages/UserManagementPage'
import { UserDetailPage } from '../features/users/pages/UserDetailPage'

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
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'trays', element: <TraysPage /> },
      { path: 'inventory', element: <Navigate to="/warehouse-overview" replace /> },
      { path: 'warehouse-overview', element: <WarehouseOverviewPage /> },
      { path: 'import-receipts', element: <ImportReceiptsPage /> },
      { path: 'boms', element: <BOMsPage /> },
      {
        path: 'orders',
        element: (
          <RoleRoute allowedRoles={['ADMIN']}>
            <OrdersPage />
          </RoleRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleRoute allowedRoles={['ADMIN']}>
            <UserManagementPage />
          </RoleRoute>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <RoleRoute allowedRoles={['ADMIN']}>
            <UserDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <RoleRoute allowedRoles={['ADMIN']}>
            <OrderDetail />
          </RoleRoute>
        ),
      },
      {
        path: 'orders/:id/edit',
        element: (
          <RoleRoute allowedRoles={['ADMIN']}>
            <OrderEditPage />
          </RoleRoute>
        ),
      },
      {
        path: 'staff/tasks',
        element: (
          <RoleRoute allowedRoles={['WAREHOUSE']}>
            <StaffTasksPage />
          </RoleRoute>
        ),
      },
      {
        path: 'staff/picking/:orderId',
        element: (
          <RoleRoute allowedRoles={['WAREHOUSE']}>
            <StaffPickingDetailPage />
          </RoleRoute>
        ),
      },
      { path: 'stock-transactions', element: <Navigate to="/warehouse-overview" replace /> },
      { path: 'pick-logs', element: <Navigate to="/orders" replace /> },
      {
        path: 'pda/picking',
        element: (
          <RoleRoute allowedRoles={['WAREHOUSE']}>
            <PDAPickingPage />
          </RoleRoute>
        ),
      },
      {
        path: 'pda/stocktaking',
        element: (
          <RoleRoute allowedRoles={['WAREHOUSE']}>
            <PDAStocktakingPage />
          </RoleRoute>
        ),
      },
      {
        path: 'pda/lookup',
        element: (
          <RoleRoute allowedRoles={['WAREHOUSE']}>
            <PDAProductLookupPage />
          </RoleRoute>
        ),
      },
      {
        path: 'pda/putaway',
        element: (
          <RoleRoute allowedRoles={['WAREHOUSE']}>
            <PDAPutawayPage />
          </RoleRoute>
        ),
      },
      { path: 'forbidden', element: <PagePlaceholder title="Forbidden" /> },
    ],
  },
  {
    // Route fallback: đường dẫn không hợp lệ -> về login.
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
