/*
Mo ta file:
- Dinh nghia toan bo data contracts TypeScript cho module BOM.
- File nay la nguon su that ve shape du lieu giua FE va BE de tranh dung any.

Luong xu ly:
1) Cac layer api/hooks/components import type tu day.
2) Type duoc tach ro cho Product/BOM/BOMItem/Create payload.
3) Khi backend doi contract, cap nhat file nay truoc roi lan luot sua cac layer khac.

Luu y khi sua:
- Khong doi ten field tuy y neu backend chua doi.
- Uu tien mo rong type thay vi dung any de de maintain.
*/

// Product type theo quy uoc backend da enforce.
export type ProductType = 'COMPONENT' | 'FINISHED_GOOD'

// Product toi gian can dung trong context BOM.
export interface ProductOption {
  id: number
  product_code: string
  product_name: string
  product_type: ProductType
  unit: string
  is_active: boolean
}

// Thong tin user toi gian de hien thi nguoi tao BOM.
export interface UserRef {
  id: number
  username: string
  full_name: string
  role: string
}

// BOM item backend tra ve trong list/detail.
export interface BOMItem {
  id: number
  bom_id: number
  component_product_id: number
  quantity: number
  component_product?: ProductOption
}

// BOM entity backend tra ve.
export interface BOM {
  id: number
  product_id: number
  bom_name: string
  description: string
  created_by?: number | null
  created_at: string
  updated_at: string
  product?: ProductOption
  creator?: UserRef
  items?: BOMItem[]
}

// Payload item khi tao/cap nhat BOM.
export interface BOMItemPayload {
  component_product_id: number
  quantity: number
}

// Payload tao/cap nhat BOM.
export interface BOMPayload {
  product_id: number
  bom_name: string
  description: string
  items: BOMItemPayload[]
}

// Response chi tiet BOM items endpoint /boms/:id/items.
export interface BOMItemsResponse {
  bom: BOM
  items: BOMItem[]
}
