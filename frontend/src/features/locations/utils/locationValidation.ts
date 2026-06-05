/*
Thông tin ghi chú:
- File này chứa validate/normalize cho form Location trước khi submit.
- Phụ thuộc vào type `CreateLocationPayload` để giữ strict TypeScript ở luồng create.
- Khi thay đổi rule nghiệp vụ (độ dài mã, shelf bắt buộc), cập nhật tại đây thay vì nhúng rải rác trong trang.
*/

import type { CreateLocationPayload } from '../types/locationTypes'

export function validateLocationForm(form: CreateLocationPayload): string | null {
  // Ghi chú: location_code là field bắt buộc theo contract backend.
  if (!form.location_code.trim()) return 'Mã location là bắt buộc.'
  if (form.location_code.trim().length > 100) return 'Mã location tối đa 100 ký tự.'
  if (form.shelf.trim().length > 50) return 'Shelf tối đa 50 ký tự.'
  return null
}

export function normalizeLocationPayload(form: CreateLocationPayload): CreateLocationPayload {
  // Ghi chú: Trim payload để giảm lỗi do khoảng trắng dư và đồng bộ dữ liệu lưu trữ.
  return {
    location_code: form.location_code.trim(),
    shelf: form.shelf.trim(),
    description: form.description.trim(),
  }
}
