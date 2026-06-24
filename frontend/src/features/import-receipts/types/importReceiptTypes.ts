/*
Thông tin ghi chú:
- File nay dinh nghia contracts TypeScript cho module Import Receipts o frontend.
- Phu thuoc truc tiep vao API backend da xac minh: GET /import-receipts, GET /import-receipts/:id, POST /import-receipts.
- Khi backend doi field JSON cua receipt/items, cap nhat type tai day truoc de giu an toan strict typing cho toan module.
*/

export interface ImportReceiptItem {
  id: number
  receipt_id: number
  product_id: number
  tray_id: number | null
  quantity: number
  actual_quantity: number
  actual_tray_id: number | null
  status: string
  assigned_to: number | null
  assigned_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ImportReceipt {
  id: number
  receipt_code: string
  supplier_name: string
  note: string
  status: string
  created_by: number | null
  created_at: string
  updated_at: string
  items: ImportReceiptItem[]
}

export interface CreateImportReceiptItemPayload {
  product_id: number
  quantity: number
}

export interface CreateImportReceiptPayload {
  supplier_name: string
  note: string
  items: CreateImportReceiptItemPayload[]
}

export interface CreateImportReceiptResponse {
  message: string
  receipt: ImportReceipt
  items: ImportReceiptItem[]
}

export interface UpdateImportReceiptResponse {
  message: string
  receipt: ImportReceipt
}

export interface DeleteImportReceiptResponse {
  message: string
}

export interface ImportReceiptItemActionResponse {
  message: string
  item: ImportReceiptItem
}

export interface ProductOption {
  id: number
  product_code: string
  product_name: string
  image_url: string
  is_active: boolean
}

export interface TrayOption {
  id: number
  tray_code: string
  qr_code: string
  product_id: number
  location_id: number
  is_active: boolean
}

export interface LocationOption {
  id: number
  location_code: string
  shelf: string
  description: string
  is_active: boolean
}

export interface ImportReceiptDisplay extends ImportReceipt {
  item_count: number
  total_quantity: number
  total_actual_quantity: number
}

export type PutawayRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface PutawayRequest {
  id: number
  product_qr_code: string
  tray_qr_code: string
  quantity: number
  note: string
  reference_code: string
  status: PutawayRequestStatus
  requested_by: number | null
  approved_by: number | null
  approved_at: string | null
  reject_reason: string
  created_at: string
  updated_at: string
}

export interface PutawayRequestApproveResponse {
  message: string
  request: PutawayRequest
}
