/*
- Mục đích: API layer cho PDA Picking replacement flow scan order/tray/product.
- Phụ thuộc: shared http client + order endpoints.
- Hợp đồng API: GET /orders/scan/:qr_code, GET /orders/:id, POST /orders/picking-tasks/:id/verify-tray, POST /orders/picking-tasks/:id/scan-product.
- Quy tắc nghiệp vụ: Khong tao/sua task truc tiep o FE; inventory mutation atomic duoc backend xu ly.
- Ghi chú refactor thay thế: thay endpoint confirm qty cu bang scan-product per-unit.
- Ghi chú luồng scanner: mỗi lượt quét submit bằng Enter trên input ẩn.
- Ghi chú bảo trì: neu backend doi endpoint, cap nhat mapping tai file nay.
*/

import { http } from '../../../shared/lib/http'
import type {
  PDAPickingOrderDetailResult,
  PDAPickingOrderResult,
  PDAScanProductInput,
  PDATaskActionResult,
  PDAVerifyTrayInput,
} from '../types/pdaPickingTypes'

export const pdaPickingApi = {
  // Ghi chú: điểm vào quét QR đơn hàng.
  scanOrder: async (qrCode: string): Promise<PDAPickingOrderResult> => {
    const { data } = await http.get<PDAPickingOrderResult>(`/orders/scan/${encodeURIComponent(qrCode)}`)
    return data
  },

  getOrderDetail: async (orderID: number): Promise<PDAPickingOrderDetailResult> => {
    const { data } = await http.get<PDAPickingOrderDetailResult>(`/orders/${orderID}`)
    return data
  },

  // Ghi chú: tray verification guard.
  verifyTray: async (input: PDAVerifyTrayInput): Promise<PDATaskActionResult> => {
    const { taskId, ...payload } = input
    const { data } = await http.post<PDATaskActionResult>(`/orders/picking-tasks/${taskId}/verify-tray`, payload)
    return data
  },

  // Ghi chú: Product QR scan increments picked quantity by exactly 1.
  scanProduct: async (input: PDAScanProductInput): Promise<PDATaskActionResult> => {
    const { taskId, ...payload } = input
    const { data } = await http.post<PDATaskActionResult>(`/orders/picking-tasks/${taskId}/scan-product`, payload)
    return data
  },
}
