/*
Thông tin ghi chú:
- File nay chua validate/normalize form phieu nhap truoc khi submit API.
- Phu thuoc vao `CreateImportReceiptPayload` de giu strict typing va tranh dung any.
- Khi doi rule nghiep vu nhap kho, cap nhat tai day de trang/components khong bi roi logic.
*/

import type {
  CreateImportReceiptItemPayload,
  CreateImportReceiptPayload,
} from '../types/importReceiptTypes'

export function validateImportReceiptForm(form: CreateImportReceiptPayload): string | null {
  // Ghi chú: ADMIN tạo phiếu kế hoạch, STAFF sẽ quét khay khi nhập thực tế.
  if (!form.items.length) return 'Phiếu nhập phải có ít nhất 1 dòng sản phẩm.'

  for (let index = 0; index < form.items.length; index += 1) {
    const item = form.items[index]
    if (!item.product_id || item.product_id <= 0) {
      return `Dòng ${index + 1}: Vui lòng chọn sản phẩm.`
    }
    if (!item.quantity || item.quantity <= 0) {
      return `Dòng ${index + 1}: Số lượng phải lớn hơn 0.`
    }
  }

  const seen = new Set<string>()
  for (const item of form.items) {
    const key = `${item.product_id}`
    if (seen.has(key)) {
      return 'Không được trùng sản phẩm trong cùng một phiếu nhập.'
    }
    seen.add(key)
  }

  return null
}

function normalizeItem(item: CreateImportReceiptItemPayload): CreateImportReceiptItemPayload {
  return {
    product_id: Number(item.product_id),
    quantity: Number(item.quantity),
  }
}

export function normalizeImportReceiptPayload(
  form: CreateImportReceiptPayload,
): CreateImportReceiptPayload {
  return {
    supplier_name: form.supplier_name.trim(),
    note: form.note.trim(),
    items: form.items.map(normalizeItem),
  }
}
