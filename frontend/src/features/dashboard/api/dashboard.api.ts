/*
Senior Handover Note:
- Purpose: API layer cho Dashboard role-based.
- Dependencies: Shared `http` client.
- API contract: GET /dashboard/stats tra payload gom role, admin_revenue, warehouse_operations.
- Role access: Backend tu enforce role; frontend chi doc response.
- Maintenance notes: Co normalize adapter de tuong thich backend shape cu, tranh crash UI khi backend chua restart/chua migrate.
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
    },
  }
}

function normalizeDashboardStatsResponse(raw: unknown): DashboardStatsResponse {
  const fallback = createEmptyDashboardResponse()

  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const candidate = raw as Partial<DashboardStatsResponse> & LegacyDashboardStats

  // Senior Handover: fallback handling - backend shape cu khong co warehouse_operations.
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
      candidate.role === 'ADMIN' || candidate.role === 'WAREHOUSE' || candidate.role === 'VIEWER'
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
    },
  }
}

export const dashboardApi = {
  // Senior Handover: admin revenue fetch + warehouse stats fetch thong qua 1 endpoint role-based.
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const { data } = await http.get<unknown>('/dashboard/stats')
    return normalizeDashboardStatsResponse(data)
  },
}
