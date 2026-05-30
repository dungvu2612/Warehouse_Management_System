/*
Thong tin handover:
- File nay chua validate/normalize payload cho tao ton va adjust ton kho.
- Phu thuoc vao types `InventoryCreatePayload`, `InventoryAdjustPayload` de giu strict typing.
- Khi doi rule nghiep vu inventory, cap nhat tai day de page/components khong bi ro logic validate.
*/

import type {
  InventoryAdjustFormValues,
  InventoryAdjustPayload,
  InventoryCreatePayload,
} from '../types/inventoryTypes'

export function validateInventoryCreateForm(form: InventoryCreatePayload): string | null {
  // Senior Handover: Tao ton ban dau can product_id + tray_id + quantity >= 0.
  if (!form.product_id || form.product_id <= 0) return 'Vui lòng chọn sản phẩm.'
  if (!form.tray_id || form.tray_id <= 0) return 'Vui lòng chọn khay.'
  if (form.quantity < 0) return 'Số lượng tồn ban đầu không được âm.'
  return null
}

export function normalizeInventoryCreatePayload(
  form: InventoryCreatePayload,
): InventoryCreatePayload {
  return {
    product_id: Number(form.product_id),
    tray_id: Number(form.tray_id),
    quantity: Number(form.quantity),
  }
}

export function validateInventoryAdjustForm(form: InventoryAdjustFormValues): string | null {
  // Senior Handover: Form adjust moi chi cho phep nhap so luong duong va map thanh delta o buoc normalize.
  if (!form.quantity || form.quantity <= 0) return 'Số lượng điều chỉnh phải lớn hơn 0.'
  return null
}

export function normalizeInventoryAdjustPayload(
  form: InventoryAdjustFormValues,
): InventoryAdjustPayload {
  // Senior Handover: IMPORT map thanh delta duong, EXPORT map thanh delta am de dung contract backend.
  const signedDelta = form.operation === 'IMPORT' ? form.quantity : -form.quantity
  return {
    delta: Number(signedDelta),
    note: form.note.trim(),
  }
}
