/*
Senior Handover Note:
- Purpose: Type contracts cho Dashboard role-based.
- Dependencies: Duoc dung boi dashboard api/hook/components.
- API contract: Mirror response GET /dashboard/stats.
- Role access: role hop le: ADMIN/WAREHOUSE/VIEWER.
- Maintenance notes: Neu backend doi field, cap nhat type tai day truoc de compile fail som.
*/

import type { UserRole } from '../../../shared/types/auth'

export type DashboardRole = UserRole

export interface DashboardRevenueSeriesItem {
  date: string
  revenue: number
}

export interface DashboardOrderStatusSummaryItem {
  status: 'PENDING' | 'PICKING' | 'COMPLETED' | 'CANCELLED' | string
  count: number
}

export interface DashboardTopFinishedProductItem {
  product_id: number
  product_code: string
  product_name: string
  quantity_sold: number
  revenue_amount: number
}

export interface DashboardRecentCompletedOrderItem {
  order_code: string
  customer_name: string
  total_amount: number
  completed_at: string
  updated_at: string
}

export interface DashboardAdminRevenue {
  total_revenue: number
  revenue_today: number
  revenue_this_month: number
  completed_orders: number
  average_order_value: number
  revenue_series: DashboardRevenueSeriesItem[]
  order_status_summary: DashboardOrderStatusSummaryItem[]
  top_finished_products: DashboardTopFinishedProductItem[]
  recent_completed_orders: DashboardRecentCompletedOrderItem[]
}

export interface DashboardWarehouseAlert {
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | string
  severity: 'WARNING' | 'CRITICAL' | 'INFO' | string
  product_id: number
  product_code: string
  product_name: string
  current_quantity: number
  min_stock: number
  message: string
}

export interface DashboardRecentPickingTask {
  task_id: number
  order_code: string
  product_code: string
  product_name: string
  tray_code: string
  required_quantity: number
  picked_quantity: number
  status: 'WAITING' | 'PICKING' | 'DONE' | string
  updated_at: string
}

export interface DashboardPickingMonitor {
  waiting_tasks: number
  picking_tasks: number
  done_tasks: number
  recent_picking_tasks: DashboardRecentPickingTask[]
}

export interface DashboardRecentWarehouseActivity {
  id: number
  transaction_type: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'ROLLBACK' | string
  reference_code: string
  product_code: string
  product_name: string
  quantity: number
  before_quantity: number
  after_quantity: number
  created_at: string
}

export interface DashboardRecentOrder {
  order_code: string
  customer_name: string
  status: 'PENDING' | 'PICKING' | 'COMPLETED' | 'CANCELLED' | string
  created_at: string
}

export interface DashboardInventoryHealth {
  healthy_products: number
  low_stock_products: number
  out_of_stock_products: number
}

export interface DashboardTopMovingProduct {
  product_id: number
  product_code: string
  product_name: string
  export_quantity: number
}

export interface DashboardWarehouseOperations {
  pending_orders: number
  picking_orders: number
  completed_today: number
  low_stock_products: number
  total_inventory_quantity: number
  active_trays: number
  warehouse_alerts: DashboardWarehouseAlert[]
  picking_monitor: DashboardPickingMonitor
  recent_activities: DashboardRecentWarehouseActivity[]
  recent_orders: DashboardRecentOrder[]
  inventory_health: DashboardInventoryHealth
  top_moving_products: DashboardTopMovingProduct[]
}

export interface DashboardStatsResponse {
  role: DashboardRole
  admin_revenue: DashboardAdminRevenue | null
  warehouse_operations: DashboardWarehouseOperations
}
