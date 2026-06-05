/*
Mo ta file:
- Lớp truy cập dữ liệu cua module BOM o frontend.
- File nay chi chiu trach nhiem goi HTTP thuan, khong chua nghiep vu loc/transform.

Luong xu ly:
1) Nhan params/payload tu service layer.
2) Goi http client dung chung den backend endpoints.
3) Tra data typed ve service.

Luu y khi sua:
- Giu API layer mong, khong map message loi UI tai day.
- Neu backend doi endpoint contract, cap nhat file nay dau tien.
*/

import { http } from '../../../shared/lib/http'
import type { BOM, BOMItemsResponse, BOMPayload, ProductOption } from '../types/bomTypes'

// Nhom API thao tac voi resources BOM.
export const bomsApi = {
  // Lay danh sach BOM, co the filter theo product_id neu can.
  getBOMs: async (productId?: number): Promise<BOM[]> => {
    const params = typeof productId === 'number' ? { product_id: productId } : undefined
    const { data } = await http.get<BOM[]>('/boms', { params })
    return data
  },

  // Lay chi tiet items cua 1 BOM.
  getBOMItems: async (bomId: number): Promise<BOMItemsResponse> => {
    const { data } = await http.get<BOMItemsResponse>(`/boms/${bomId}/items`)
    return data
  },

  // Tao BOM moi.
  createBOM: async (payload: BOMPayload): Promise<BOM> => {
    const { data } = await http.post<BOM>('/boms', payload)
    return data
  },

  // Cap nhat BOM.
  updateBOM: async (id: number, payload: BOMPayload): Promise<BOM> => {
    const { data } = await http.put<BOM>(`/boms/${id}`, payload)
    return data
  },

  // Xoa BOM.
  deleteBOM: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/boms/${id}`)
    return data
  },

  // Lay danh sach products (service se quyet dinh cach loc theo product_type).
  getProducts: async (): Promise<ProductOption[]> => {
    const { data } = await http.get<ProductOption[]>('/products')
    return data
  },
}
