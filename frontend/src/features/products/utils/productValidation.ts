import type { ProductPayload } from '../types/productTypes'

// Validate form product phía frontend trước khi gọi API.
export function validateProductForm(form: ProductPayload): string | null {
  if (!form.product_name.trim()) {
    return 'product_name là bắt buộc.'
  }

  if (form.min_stock < 0 || form.price < 0) {
    return 'min_stock và price phải >= 0.'
  }

  return null
}

// Chuẩn hóa payload trước khi gửi backend.
export function normalizeProductPayload(form: ProductPayload): ProductPayload {
  return {
    product_code: form.product_code.trim().toUpperCase(),
    product_name: form.product_name.trim(),
    product_type: form.product_type,
    description: form.description.trim(),
    unit: form.unit.trim() || 'pcs',
    min_stock: Number(form.min_stock),
    price: Number(form.price),
  }
}
