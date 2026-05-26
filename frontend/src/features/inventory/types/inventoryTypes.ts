/*
Senior Handover Note:
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

export interface InventoryCreatePayload {
  product_id: number
  tray_id: number
  quantity: number
}

export interface InventoryAdjustPayload {
  delta: number
  note: string
}

export type InventoryAdjustOperation = 'IMPORT' | 'EXPORT'

export interface InventoryAdjustFormValues {
  operation: InventoryAdjustOperation
  quantity: number
  note: string
}

export interface InventoryAdjustResponse {
  message: string
  data: InventoryItem
}

export interface ProductOption {
  id: number
  product_code: string
  product_name: string
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
  min_stock: number
  tray_code: string
  location_code: string
  location_description: string
  is_low_stock: boolean
  is_virtual_row: boolean
}

export interface StockTransactionItem {
  id: number
  transaction_type: string
  product_id: number
  tray_id: number | null
  quantity: number
  before_quantity: number
  after_quantity: number
  reference_code: string
  note: string
  created_by: number | null
  created_at: string
}

export interface StockTransactionDisplayItem extends StockTransactionItem {
  product_code: string
  product_name: string
  tray_code: string
  location_code: string
}
