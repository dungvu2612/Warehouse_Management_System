/*
Thông tin ghi chú:
- File nay chua validate/normalize payload cho dieu chinh ton kho.
- Phu thuoc vao types `InventoryAdjustPayload` de giu strict typing.
- Khi doi rule nghiep vu inventory, cap nhat tai day de trang/components khong bi ro logic validate.
*/

import type {
  InventoryAdjustFormValues,
  InventoryAdjustPayload,
} from '../types/inventoryTypes'

export function validateInventoryAdjustForm(form: InventoryAdjustFormValues): string | null {
  // Ghi chú: Form adjust moi chi cho phep nhap so luong duong va map thanh delta o buoc normalize.
  if (!form.quantity || form.quantity <= 0) return 'Số lượng điều chỉnh phải lớn hơn 0.'
  return null
}

export function normalizeInventoryAdjustPayload(
  form: InventoryAdjustFormValues,
): InventoryAdjustPayload {
  // Ghi chú: IMPORT map thanh delta duong, EXPORT map thanh delta am de dung contract backend.
  const signedDelta = form.operation === 'IMPORT' ? form.quantity : -form.quantity
  return {
    delta: Number(signedDelta),
    note: form.note.trim(),
  }
}
