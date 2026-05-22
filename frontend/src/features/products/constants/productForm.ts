import type { ProductPayload } from '../types/productTypes'

// Giá trị mặc định form product.
export const defaultProductForm: ProductPayload = {
  product_code: '',
  product_name: '',
  product_type: 'COMPONENT',
  description: '',
  unit: 'pcs',
  min_stock: 0,
  price: 0,
}
