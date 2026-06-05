/*
Mo ta file:
- Chua validation/normalization cho form BOM truoc khi goi API.
- Tach rieng de trang/components gon va de unit test sau nay.

Luong xu ly:
1) Validate payload o muc frontend (required fields, duplicate component, qty > 0).
2) Normalize text/number de payload sach se.
3) Tra error message than thien cho UI neu du lieu chua hop le.
*/

import type { BOMPayload } from '../types/bomTypes'

// Validate payload tao/cap nhat BOM o FE.
export function validateBOMForm(payload: BOMPayload): string | null {
  // Product cha bat buoc phai duoc chon.
  if (!payload.product_id || payload.product_id <= 0) {
    return 'Vui lòng chọn Thành phẩm cha cho BOM.'
  }

  // Can it nhat 1 component.
  if (!payload.items.length) {
    return 'BOM phải có ít nhất 1 linh kiện component.'
  }

  // Kiem tra duplicate component va qty hop le.
  const seen = new Set<number>()
  for (const item of payload.items) {
    if (!item.component_product_id || item.component_product_id <= 0) {
      return 'Vui lòng chọn đầy đủ linh kiện component.'
    }
    if (!item.quantity || item.quantity <= 0) {
      return 'Số lượng linh kiện phải lớn hơn 0.'
    }
    if (seen.has(item.component_product_id)) {
      return 'Không được trùng linh kiện trong cùng BOM.'
    }
    seen.add(item.component_product_id)
  }

  return null
}

// Normalize payload truoc khi submit.
export function normalizeBOMPayload(payload: BOMPayload): BOMPayload {
  return {
    product_id: Number(payload.product_id),
    bom_name: payload.bom_name.trim(),
    description: payload.description.trim(),
    items: payload.items.map((item) => ({
      component_product_id: Number(item.component_product_id),
      quantity: Number(item.quantity),
    })),
  }
}
