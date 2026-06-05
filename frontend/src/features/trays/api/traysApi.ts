/*
Thông tin ghi chú:
- File nay la API layer thuan HTTP cho module Trays.
- Phu thuoc vao shared `http` client de tai su dung auth token/interceptor hien co.
- Chi chua request/response typed; khong dat business logic UI tai day.
*/

import { http } from '../../../shared/lib/http'
import type { LocationOption, ProductOption, Tray, TrayPayload, TrayScanResponse } from '../types/trayTypes'

export const traysApi = {
  // Ghi chú: Fetch danh sach tray active cho man hinh list.
  getTrays: async (): Promise<Tray[]> => {
    const { data } = await http.get<Tray[]>('/trays')
    return data
  },

  // Ghi chú: Tao tray moi; backend enforce role ADMIN.
  createTray: async (payload: TrayPayload): Promise<Tray> => {
    const { data } = await http.post<Tray>('/trays', payload)
    return data
  },

  // Ghi chú: Cap nhat tray theo id.
  updateTray: async (id: number, payload: TrayPayload): Promise<Tray> => {
    const { data } = await http.put<Tray>(`/trays/${id}`, payload)
    return data
  },

  // Ghi chú: Xoa mem tray theo id.
  deleteTray: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/trays/${id}`)
    return data
  },

  // Ghi chú: Lay options product de do vao form tao tray.
  getProductOptions: async (): Promise<ProductOption[]> => {
    const { data } = await http.get<ProductOption[]>('/products')
    return data
  },

  // Ghi chú: Lay options location de do vao form tao tray.
  getLocationOptions: async (): Promise<LocationOption[]> => {
    const { data } = await http.get<LocationOption[]>('/locations')
    return data
  },

  scanTrayByQRCode: async (qrCode: string): Promise<TrayScanResponse> => {
    const { data } = await http.get<TrayScanResponse>(`/trays/scan/${encodeURIComponent(qrCode)}`)
    return data
  },
}
