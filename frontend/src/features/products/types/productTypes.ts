export type ProductType = 'COMPONENT' | 'FINISHED_GOOD'

// Kiểu dữ liệu product theo contract backend.
export interface Product {
  id: number
  product_code: string
  product_name: string
  product_type: ProductType
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
  product_name: string
  product_type: ProductType
  description: string
  unit: string
  min_stock: number
  price: number
}

export interface ProductCodePreviewResponse {
  product_code: string
}
