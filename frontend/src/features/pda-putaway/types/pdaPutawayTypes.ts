/*
- Mục đích: Types cho PDA Putaway mode.
- Phụ thuộc: endpoint POST /inventory/putaway.
- Hợp đồng API: payload product_qr_code + tray_qr_code + quantity + note/reference.
- Warehouse business rules: putaway tang ton va tao stock transaction IMPORT.
- Ghi chú luồng scanner: scan product -> scan tray -> enter qty -> enter submit.
- Ghi chú bảo trì: bo sung field neu backend update response.
*/

export interface PDAPutawayPayload {
  product_qr_code: string
  tray_qr_code: string
  quantity: number
  note?: string
  reference_code?: string
}

export interface PDAPutawayResponse {
  message: string
}
