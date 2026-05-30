/*
Senior Handover Note:
- Purpose: Data-access layer read-only cho module Orders sau replacement refactor.
- Dependencies: shared http client.
- API contract: GET /orders, GET /orders/:id.
- Business rules: Orders API tai module nay khong chua thao tac picking.
- Replacement refactor notes: old endpoints scan/confirm/finish da dua sang PDA module va backend dedicated flow.
- Maintenance notes: Neu can mutation moi cho orders, tao API rieng va tranh tron voi picking flow.
*/

import { http } from '../../../shared/lib/http'
import type {
  Order,
  OrderDetailResponse,
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

  updateOrder: async (
    id: number,
    payload: {
      customer_name: string
      customer_phone?: string
      customer_address?: string
      items: Array<{ product_id: number; quantity: number; unit_price: number }>
    },
  ): Promise<Order> => {
    const { data } = await http.put<Order>(`/orders/${id}`, payload)
    return data
  },

  deleteOrder: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/orders/${id}`)
    return data
  },
}
