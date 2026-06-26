/*
Thông tin ghi chú:
- File nay dinh nghia contracts TypeScript cho module Inventory o frontend.
- Phu thuoc truc tiep vao API backend da xac minh: GET /inventory, POST /inventory, PATCH /inventory/:id/adjust.
- Khi backend doi shape response (dac biet endpoint adjust tra object boc data), cap nhat tai day truoc de tranh vo cac layer con.
*/

export interface InventoryItem {
  id: number
  product_id: number
  tray_id: number
  quantity: number
  created_at: string
  updated_at: string
}

export interface InventoryAdjustPayload {
  delta: number
  note: string
}

export interface InventoryCreatePayload {
  product_id: number
  tray_id: number
  quantity: number
  note: string
}

export interface InventoryPutawayPayload {
  product_qr_code: string
  tray_qr_code: string
  quantity: number
  note?: string
  reference_code?: string
}

export interface InventoryStocktakingPayload {
  tray_qr_code: string
  physical_qty: number
  note?: string
  reference_code?: string
}

export interface InventoryStocktakingResponse {
  message: string
  data: InventoryItem
  delta: number
}


export type InventoryAdjustOperation = 'IMPORT' | 'EXPORT'

export interface InventoryAdjustFormValues {
  operation: InventoryAdjustOperation
  quantity: number
  note: string
  tray_id: number | ''
}

export interface InventoryAdjustResponse {
  message: string
  data: InventoryItem
}

export interface ProductOption {
  id: number
  product_code: string
  product_name: string
  image_url: string
  min_stock: number
  is_active: boolean
}

export interface TrayOption {
  id: number
  tray_code: string
  product_id: number
  location_id: number
  is_active: boolean
}

export interface LocationOption {
  id: number
  location_code: string
  description: string
  shelf: string
  is_active: boolean
}

export interface InventoryDisplayItem extends InventoryItem {
  product_code: string
  product_name: string
  product_image_url: string
  min_stock: number
  tray_code: string
  location_code: string
  location_description: string
  is_low_stock: boolean
  is_virtual_row: boolean
}
