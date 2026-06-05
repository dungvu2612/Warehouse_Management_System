/*
- Mục đích: Service ứng dụng chỉ xem cho module Orders sau replacement refactor.
- Phụ thuộc: ordersApi.
- Hợp đồng API: GET /orders, GET /orders/:id.
- Quy tắc nghiệp vụ: Orders module khong duoc goi API picking/confirm/finish.
- Ghi chú refactor thay thế: da loai bo toan bo helper mutation picking cu.
- Ghi chú bảo trì: giu helper filterOrdersByKeyword de phuc vu list UI.
*/

import { ordersApi } from '../api/ordersApi'
import type {
  Order,
  OrderDetailResponse,
  OrderStatus,
} from '../types/orderTypes'

export const orderService = {
  getOrders: async (status?: OrderStatus): Promise<Order[]> => {
    return ordersApi.getOrders(status)
  },

  getOrderById: async (id: number): Promise<OrderDetailResponse> => {
    return ordersApi.getOrderById(id)
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
    return ordersApi.updateOrder(id, payload)
  },

  deleteOrder: async (id: number): Promise<{ message: string }> => {
    return ordersApi.deleteOrder(id)
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
}
