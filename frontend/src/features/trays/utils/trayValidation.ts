/*
Senior Handover Note:
- File nay chua validate/normalize form Tray truoc khi submit API.
- Phu thuoc vao `TrayPayload` de giu strict typing va tranh dung any.
- Khi doi rule nghiep vu (do dai ma, bat buoc field), cap nhat tai day de page/components khong bi roi.
*/

import type { TrayPayload } from '../types/trayTypes'

export function validateTrayForm(form: TrayPayload): string | null {
  // Senior Handover: Backend moi chi yeu cau product_id + location_id; tray_code/qr_code duoc auto-gen.
  if (!form.product_id || form.product_id <= 0) return 'Vui lòng chọn sản phẩm.'
  if (!form.location_id || form.location_id <= 0) return 'Vui lòng chọn location.'
  return null
}

export function normalizeTrayPayload(form: TrayPayload): TrayPayload {
  // Senior Handover: Trim text va ep number de payload dong nhat truoc khi goi API.
  return {
    product_id: Number(form.product_id),
    location_id: Number(form.location_id),
    description: form.description.trim(),
  }
}
