import type { ProductPayload } from '../types/productTypes'

/*
Thông tin ghi chú:
- File nay chua validate/normalize form Product truoc khi submit API.
- Phu thuoc vao type `ProductPayload`.
- Luu y bao tri: khi doi rule nghiep vu product, cap nhat tai day de tranh ro logic validate o trang/component.
*/

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
  const normalizedCode = form.product_code.trim().toUpperCase()
  const normalizedQRCode = form.qr_code.trim().toUpperCase()

  return {
    product_code: normalizedCode,
    qr_code: normalizedQRCode || normalizedCode,
    product_name: form.product_name.trim(),
    product_type: form.product_type,
    image_url: form.image_url.trim(),
    description: form.description.trim(),
    unit: form.unit.trim() || 'pcs',
    min_stock: Number(form.min_stock),
    price: Number(form.price),
  }
}
