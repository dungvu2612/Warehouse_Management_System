/*
Thông tin ghi chú:
- File nay la API layer thuan HTTP cho module Inventory.
- Phu thuoc vao shared `http` client de tai su dung auth token/interceptor hien co.
- Chi chua request/response typed; khong dat business logic UI tai day.
*/

import { http } from '../../../shared/lib/http'
import type {
  InventoryAdjustPayload,
  InventoryAdjustResponse,
  InventoryItem,
  InventoryPutawayPayload,
  InventoryStocktakingPayload,
  InventoryStocktakingResponse,
  LocationOption,
  ProductOption,
  TrayOption,
} from '../types/inventoryTypes'

export const inventoryApi = {
  // Ghi chú: Fetch inventory list tu endpoint GET /inventory.
  getInventory: async (): Promise<InventoryItem[]> => {
    const { data } = await http.get<InventoryItem[]>('/inventory')
    return data
  },

  // Ghi chú: Dieu chinh ton kho theo endpoint PATCH /inventory/:id/adjust.
  adjustInventory: async (
    id: number,
    payload: InventoryAdjustPayload,
  ): Promise<InventoryAdjustResponse> => {
    const { data } = await http.patch<InventoryAdjustResponse>(`/inventory/${id}/adjust`, payload)
    return data
  },

  putaway: async (payload: InventoryPutawayPayload): Promise<InventoryAdjustResponse> => {
    const { data } = await http.post<InventoryAdjustResponse>('/inventory/putaway', payload)
    return data
  },

  stocktaking: async (payload: InventoryStocktakingPayload): Promise<InventoryStocktakingResponse> => {
    const { data } = await http.post<InventoryStocktakingResponse>('/inventory/stocktaking', payload)
    return data
  },

  // Ghi chú: Lay products/trays/locations de enrich du lieu va filter UI.
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

}
