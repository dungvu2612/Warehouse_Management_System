/*
Mo ta file:
- Chua cac ham validate du lieu form cho module Orders.
- Layer nay validate dau vao truoc khi gui request de UX ro rang hon.

Luong xu ly:
1) Page goi validate truoc mutation.
2) Neu loi thi hien thong bao ngay, khong goi API.
*/

import type {
  ConfirmPickingPayload,
  OrderCreatePayload,
  ScanOrderPayload,
} from '../types/orderTypes'

export function validateOrderCreateForm(payload: OrderCreatePayload): string {
  if (!payload.bom_id || payload.bom_id <= 0) {
    return 'Vui lòng chọn BOM để tạo đơn.'
  }

  if (!Number.isFinite(payload.machine_qty) || payload.machine_qty <= 0) {
    return 'Số lượng máy phải lớn hơn 0.'
  }

  return ''
}

export function validateScanOrderForm(payload: ScanOrderPayload): string {
  if (!payload.order_code.trim()) {
    return 'Vui lòng nhập order code hoặc QR code.'
  }

  return ''
}

export function validateConfirmPickingForm(payload: ConfirmPickingPayload): string {
  if (!payload.tray_code.trim()) {
    return 'Vui lòng nhập mã khay (tray_code).'
  }

  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    return 'Số lượng picking phải lớn hơn 0.'
  }

  return ''
}
