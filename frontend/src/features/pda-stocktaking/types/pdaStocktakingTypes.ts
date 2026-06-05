/*
- Mục đích: Types cho PDA Stocktaking mode.
- Phụ thuộc: endpoint POST /inventory/stocktaking va GET /trays/scan/:qr_code.
- Hợp đồng API: stocktaking payload tray_qr_code + physical_qty.
- Warehouse business rules: so sanh system qty va physical qty, ghi ADJUST transaction.
- Ghi chú luồng scanner: scan tray lien tuc, Enter submit nhanh.
- Ghi chú bảo trì: keep payload small for scanner flow.
*/

import type { InventoryItem } from '../../inventory/types/inventoryTypes'

export interface TrayScanInventoryItem {
  inventory_id: number
  product_id: number
  product_code: string
  product_name: string
  quantity: number
  last_updated_at: string
}

export interface TrayScanResponse {
  tray: {
    id: number
    tray_code: string
    qr_code: string
  }
  location_code: string
  inventory_items: TrayScanInventoryItem[]
  inventory_total: number
}

export interface PDAStocktakingPayload {
  tray_qr_code: string
  physical_qty: number
  note?: string
  reference_code?: string
}

export interface PDAStocktakingResponse {
  message: string
  data: InventoryItem
  delta: number
}
