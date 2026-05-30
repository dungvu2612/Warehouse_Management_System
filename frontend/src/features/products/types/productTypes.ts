export type ProductType = 'COMPONENT' | 'FINISHED_GOOD'

/*
Thong tin handover:
- File nay dinh nghia contracts TypeScript cho module Products o frontend.
- Phu thuoc truc tiep vao schema backend cho endpoint products va code-preview.
- Luu y bao tri: khi backend doi field product (nhat la image_url), cap nhat type tai day truoc de giu strict typing.
*/

// Kiểu dữ liệu product theo contract backend.
export interface Product {
  id: number
  product_code: string
  qr_code: string
  product_name: string
  product_type: ProductType
  image_url: string
  description: string
  unit: string
  min_stock: number
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Payload tạo/sửa product.
export interface ProductPayload {
  product_code: string
  qr_code: string
  product_name: string
  product_type: ProductType
  image_url: string
  description: string
  unit: string
  min_stock: number
  price: number
}

export interface ProductCodePreviewResponse {
  product_code: string
}

export interface ProductScanTray {
  inventory_id: number
  tray_id: number
  tray_code: string
  location_id: number
  location_code: string
  quantity: number
  last_updated_at: string
}

export interface ProductScanResponse {
  product: Product
  inventory_total: number
  trays: ProductScanTray[]
}
