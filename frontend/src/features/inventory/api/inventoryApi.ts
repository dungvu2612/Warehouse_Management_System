/*
Senior Handover Note:
- File nay la API layer thuan HTTP cho module Inventory.
- Phu thuoc vao shared `http` client de tai su dung auth token/interceptor hien co.
- Chi chua request/response typed; khong dat business logic UI tai day.
*/

import { http } from '../../../shared/lib/http'
import type {
  InventoryAdjustPayload,
  InventoryAdjustResponse,
  InventoryCreatePayload,
  InventoryItem,
  LocationOption,
  ProductOption,
  StockTransactionItem,
  TrayOption,
} from '../types/inventoryTypes'

export const inventoryApi = {
  // Senior Handover: Fetch inventory list tu endpoint GET /inventory.
  getInventory: async (): Promise<InventoryItem[]> => {
    const { data } = await http.get<InventoryItem[]>('/inventory')
    return data
  },

  // Senior Handover: Tao ton ban dau neu backend ho tro POST /inventory (da xac minh co route).
  createInventory: async (payload: InventoryCreatePayload): Promise<InventoryItem> => {
    const { data } = await http.post<InventoryItem>('/inventory', payload)
    return data
  },

  // Senior Handover: Dieu chinh ton kho theo endpoint PATCH /inventory/:id/adjust.
  adjustInventory: async (
    id: number,
    payload: InventoryAdjustPayload,
  ): Promise<InventoryAdjustResponse> => {
    const { data } = await http.patch<InventoryAdjustResponse>(`/inventory/${id}/adjust`, payload)
    return data
  },

  // Senior Handover: Lay products/trays/locations de enrich du lieu va filter UI.
  getProducts: async (): Promise<ProductOption[]> => {
    const { data } = await http.get<ProductOption[]>('/products')
    return data
  },

  getTrays: async (): Promise<TrayOption[]> => {
    const { data } = await http.get<TrayOption[]>('/trays')
    return data
  },

  getLocations: async (): Promise<LocationOption[]> => {
    const { data } = await http.get<LocationOption[]>('/locations')
    return data
  },

  // Senior Handover: Lay lich su stock transactions de hien thi ben duoi bang inventory.
  getStockTransactions: async (params?: {
    transaction_type?: string
    limit?: number
  }): Promise<StockTransactionItem[]> => {
    const { data } = await http.get<StockTransactionItem[]>('/stock-transactions', { params })
    return data
  },
}
