/*
API layer cho Dashboard role-based.
Có normalize adapter để tương thích response cũ.
*/

import { http } from '../../../shared/lib/http'
import type { DashboardStatsResponse } from '../types/dashboard.types'

type LegacyDashboardStats = {
  orders_pending?: number
  orders_picking?: number
  orders_completed?: number
  total_stock_qty?: number
  low_stock_count?: number
}

function createEmptyDashboardResponse(): DashboardStatsResponse {
  return {
    role: 'WAREHOUSE',
    admin_revenue: null,
    warehouse_operations: {
      pending_orders: 0,
      picking_orders: 0,
      completed_today: 0,
      low_stock_products: 0,
      total_inventory_quantity: 0,
      active_trays: 0,
      warehouse_alerts: [],
      picking_monitor: {
        waiting_tasks: 0,
        picking_tasks: 0,
        done_tasks: 0,
        recent_picking_tasks: [],
      },
      recent_activities: [],
      recent_orders: [],
      inventory_health: {
        healthy_products: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
      },
      top_moving_products: [],
      order_status_chart: [],
    },
  }
}

function normalizeDashboardStatsResponse(raw: unknown): DashboardStatsResponse {
  const fallback = createEmptyDashboardResponse()

  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const candidate = raw as Partial<DashboardStatsResponse> & LegacyDashboardStats

  // Tương thích backend cũ không có warehouse_operations.
  if (!candidate.warehouse_operations) {
    return {
      ...fallback,
      warehouse_operations: {
        ...fallback.warehouse_operations,
        pending_orders: Number(candidate.orders_pending || 0),
        picking_orders: Number(candidate.orders_picking || 0),
        completed_today: Number(candidate.orders_completed || 0),
        low_stock_products: Number(candidate.low_stock_count || 0),
        total_inventory_quantity: Number(candidate.total_stock_qty || 0),
      },
    }
  }

  return {
    role:
      candidate.role === 'ADMIN' || candidate.role === 'WAREHOUSE'
        ? candidate.role
        : fallback.role,
    admin_revenue: candidate.admin_revenue ?? null,
    warehouse_operations: {
      ...fallback.warehouse_operations,
      ...candidate.warehouse_operations,
      warehouse_alerts: candidate.warehouse_operations.warehouse_alerts || [],
      picking_monitor: {
        ...fallback.warehouse_operations.picking_monitor,
        ...candidate.warehouse_operations.picking_monitor,
        recent_picking_tasks: candidate.warehouse_operations.picking_monitor?.recent_picking_tasks || [],
      },
      recent_activities: candidate.warehouse_operations.recent_activities || [],
      recent_orders: candidate.warehouse_operations.recent_orders || [],
      inventory_health: {
        ...fallback.warehouse_operations.inventory_health,
        ...candidate.warehouse_operations.inventory_health,
      },
      top_moving_products: candidate.warehouse_operations.top_moving_products || [],
      order_status_chart: candidate.warehouse_operations.order_status_chart || [],
    },
  }
}

export const dashboardApi = {
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const { data } = await http.get<unknown>('/dashboard/stats')
    return normalizeDashboardStatsResponse(data)
  },
}
