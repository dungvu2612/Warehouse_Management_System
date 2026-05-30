/*
Senior Handover Note:
- Purpose: API layer cho PDA Picking replacement flow scan order/tray/product.
- Dependencies: shared http client + order endpoints.
- API contract: GET /orders/scan/:qr_code, GET /orders/:id, POST /orders/picking-tasks/:id/verify-tray, POST /orders/picking-tasks/:id/scan-product.
- Business rules: Khong tao/sua task truc tiep o FE; inventory mutation atomic duoc backend xu ly.
- Replacement refactor notes: thay endpoint confirm qty cu bang scan-product per-unit.
- Scanner workflow notes: moi scan submit bang Enter tren hidden input.
- Maintenance notes: neu backend doi endpoint, cap nhat mapping tai file nay.
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
  // Senior Handover: order QR scan entry point.
  scanOrder: async (qrCode: string): Promise<PDAPickingOrderResult> => {
    const { data } = await http.get<PDAPickingOrderResult>(`/orders/scan/${encodeURIComponent(qrCode)}`)
    return data
  },

  getOrderDetail: async (orderID: number): Promise<PDAPickingOrderDetailResult> => {
    const { data } = await http.get<PDAPickingOrderDetailResult>(`/orders/${orderID}`)
    return data
  },

  // Senior Handover: tray verification guard.
  verifyTray: async (input: PDAVerifyTrayInput): Promise<PDATaskActionResult> => {
    const { taskId, ...payload } = input
    const { data } = await http.post<PDATaskActionResult>(`/orders/picking-tasks/${taskId}/verify-tray`, payload)
    return data
  },

  // Senior Handover: Product QR scan increments picked quantity by exactly 1.
  scanProduct: async (input: PDAScanProductInput): Promise<PDATaskActionResult> => {
    const { taskId, ...payload } = input
    const { data } = await http.post<PDATaskActionResult>(`/orders/picking-tasks/${taskId}/scan-product`, payload)
    return data
  },
}
