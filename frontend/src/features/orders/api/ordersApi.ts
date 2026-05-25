/*
Mo ta file:
- Data-access layer (HTTP thuần) cho module Orders/Picking.
- File nay chi goi endpoint backend, khong chua nghiep vu giao dien.

Luong xu ly:
1) Nhan params/payload tu service layer.
2) Goi shared http client.
3) Tra response typed ve service/hook.
*/

import { http } from '../../../shared/lib/http'
import type {
  BOMOption,
  ConfirmPickingPayload,
  ConfirmPickingResponse,
  Order,
  OrderCreatePayload,
  OrderDetailResponse,
  OrderFinishResponse,
  OrderProgress,
  PickingTasksResponse,
  ScanOrderPayload,
  ScanOrderResponse,
} from '../types/orderTypes'

export const ordersApi = {
  getOrders: async (status?: string): Promise<Order[]> => {
    const params = status ? { status } : undefined
    const { data } = await http.get<Order[]>('/orders', { params })
    return data
  },

  getOrderById: async (id: number): Promise<OrderDetailResponse> => {
    const { data } = await http.get<OrderDetailResponse>(`/orders/${id}`)
    return data
  },

  createOrder: async (payload: OrderCreatePayload): Promise<Order> => {
    const { data } = await http.post<Order>('/orders', payload)
    return data
  },

  scanOrderForPicking: async (payload: ScanOrderPayload): Promise<ScanOrderResponse> => {
    const { data } = await http.post<ScanOrderResponse>('/orders/scan', payload)
    return data
  },

  getPickingTasks: async (orderId: number): Promise<PickingTasksResponse> => {
    const { data } = await http.get<PickingTasksResponse>(`/orders/${orderId}/picking-tasks`)
    return data
  },

  getOrderProgress: async (orderId: number): Promise<OrderProgress> => {
    const { data } = await http.get<OrderProgress>(`/orders/${orderId}/progress`)
    return data
  },

  confirmPickingTask: async (
    taskId: number,
    payload: ConfirmPickingPayload,
  ): Promise<ConfirmPickingResponse> => {
    const { data } = await http.patch<ConfirmPickingResponse>(
      `/orders/picking-tasks/${taskId}/confirm`,
      payload,
    )
    return data
  },

  finishOrder: async (orderId: number): Promise<OrderFinishResponse> => {
    const { data } = await http.post<OrderFinishResponse>(`/orders/${orderId}/finish`)
    return data
  },

  // Dung danh sach BOM lam source de tao order tu BOM.
  getBOMOptions: async (): Promise<BOMOption[]> => {
    const { data } = await http.get<BOMOption[]>('/boms')
    return data
  },
}
