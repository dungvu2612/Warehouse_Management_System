/*
Senior Handover Note:
- File nay dinh nghia contracts TypeScript cho module Trays o frontend (CRUD + read-model display).
- Phu thuoc truc tiep vao schema backend cho cac endpoint: GET/POST/PUT/DELETE /trays, GET /products, GET /locations.
- Khi backend doi ten field JSON, cap nhat type tai day truoc de compile bao cac diem anh huong.
*/

export interface Tray {
  id: number
  tray_code: string
  product_id: number
  location_id: number
  qr_code: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrayDisplay extends Tray {
  location_code: string
  location_description: string
}

export interface TrayPayload {
  product_id: number
  location_id: number
  description: string
}

export interface ProductOption {
  id: number
  product_code: string
  product_name: string
  is_active: boolean
}

export interface LocationOption {
  id: number
  location_code: string
  shelf: string
  description: string
  is_active: boolean
}
