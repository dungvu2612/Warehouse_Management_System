/*
Senior Handover Note:
- Purpose: Types cho PDA Putaway mode.
- Dependencies: endpoint POST /inventory/putaway.
- API contract: payload product_qr_code + tray_qr_code + quantity + note/reference.
- Warehouse business rules: putaway tang ton va tao stock transaction IMPORT.
- Scanner workflow notes: scan product -> scan tray -> enter qty -> enter submit.
- Maintenance notes: bo sung field neu backend update response.
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
