/*
Mo ta file:
- Application service layer cho module Orders/Picking.
- Noi chua nghiep vu FE: filter danh sach, tinh toan progress helper, map data phuc vu UI.

Luong xu ly:
1) Hooks goi service thay vi goi API truc tiep.
2) Service goi api layer de lay du lieu tho.
3) Service tra du lieu typed + helper functions cho page/components.
*/

import { ordersApi } from '../api/ordersApi'
import type {
  BOMOption,
  ConfirmPickingPayload,
  ConfirmPickingResponse,
  Order,
  OrderCreatePayload,
  OrderDetailResponse,
  OrderFinishResponse,
  OrderProgress,
  OrderStatus,
  PickingTask,
  PickingTasksResponse,
  ScanOrderPayload,
  ScanOrderResponse,
} from '../types/orderTypes'

export const orderService = {
  getOrders: async (status?: OrderStatus): Promise<Order[]> => {
    return ordersApi.getOrders(status)
  },

  getOrderById: async (id: number): Promise<OrderDetailResponse> => {
    return ordersApi.getOrderById(id)
  },

  createOrder: async (payload: OrderCreatePayload): Promise<Order> => {
    return ordersApi.createOrder(payload)
  },

  scanOrderForPicking: async (payload: ScanOrderPayload): Promise<ScanOrderResponse> => {
    return ordersApi.scanOrderForPicking(payload)
  },

  getPickingTasks: async (orderId: number): Promise<PickingTasksResponse> => {
    return ordersApi.getPickingTasks(orderId)
  },

  getOrderProgress: async (orderId: number): Promise<OrderProgress> => {
    return ordersApi.getOrderProgress(orderId)
  },

  confirmPickingTask: async (
    taskId: number,
    payload: ConfirmPickingPayload,
  ): Promise<ConfirmPickingResponse> => {
    return ordersApi.confirmPickingTask(taskId, payload)
  },

  finishOrder: async (orderId: number): Promise<OrderFinishResponse> => {
    return ordersApi.finishOrder(orderId)
  },

  getBOMOptions: async (): Promise<BOMOption[]> => {
    return ordersApi.getBOMOptions()
  },

  // Loc nhanh danh sach orders theo keyword (order_code, customer_name, qr_code).
  filterOrdersByKeyword: (orders: Order[], keywordRaw: string): Order[] => {
    const keyword = keywordRaw.trim().toLowerCase()
    if (!keyword) return orders

    return orders.filter((order) => {
      const orderCode = order.order_code?.toLowerCase() || ''
      const customerName = order.customer_name?.toLowerCase() || ''
      const qrCode = order.qr_code?.toLowerCase() || ''

      return (
        orderCode.includes(keyword) || customerName.includes(keyword) || qrCode.includes(keyword)
      )
    })
  },

  // Helper lay ratio progress fallback khi endpoint progress chua duoc goi.
  computeProgressFromTasks: (tasks: PickingTask[]): number => {
    if (tasks.length === 0) return 0

    const doneCount = tasks.filter((task) => task.status === 'DONE').length
    return Math.round((doneCount / tasks.length) * 100)
  },
}
