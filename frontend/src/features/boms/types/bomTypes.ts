/*
Thông tin ghi chú:
- File dinh nghia toan bo TypeScript contracts cua feature BOM.
- Duoc su dung boi cac layer api/service/hook/component de dong bo shape du lieu.
- Luu y bao tri: khi backend products thay doi contract (vi du image_url), can cap nhat tai day truoc de tranh sai type day chuyen.
*/

// Product type theo quy uoc backend da enforce.
export type ProductType = 'COMPONENT' | 'FINISHED_GOOD'

// Product toi gian can dung trong context BOM.
export interface ProductOption {
  id: number
  product_code: string
  product_name: string
  image_url?: string
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
