/*
Thong tin handover:
- File này là service layer của module Locations, đứng giữa hooks và API layer (CRUD).
- Phụ thuộc vào `locationsApi` để thao tác dữ liệu và export helper lọc danh sách cho page.
- Không đưa React state vào đây; chỉ giữ use-case dùng chung để page/components tái sử dụng.
*/

import { locationsApi } from '../api/locationsApi'
import type { CreateLocationPayload, Location, UpdateLocationPayload } from '../types/locationTypes'

export const locationService = {
  // Senior Handover: Lấy danh sách location từ backend.
  getLocations: async (): Promise<Location[]> => {
    return locationsApi.getLocations()
  },

  // Senior Handover: Tạo location mới thông qua API layer.
  createLocation: async (payload: CreateLocationPayload): Promise<Location> => {
    return locationsApi.createLocation(payload)
  },

  // Senior Handover: Cập nhật location theo id.
  updateLocation: async (id: number, payload: UpdateLocationPayload): Promise<Location> => {
    return locationsApi.updateLocation(id, payload)
  },

  // Senior Handover: Xóa mềm location theo id.
  deleteLocation: async (id: number): Promise<{ message: string }> => {
    return locationsApi.deleteLocation(id)
  },

  // Senior Handover: Lọc cục bộ theo mã vị trí, shelf, mô tả để UX tìm kiếm nhanh.
  filterLocationsByKeyword: (locations: Location[], keywordRaw: string): Location[] => {
    const keyword = keywordRaw.trim().toLowerCase()
    if (!keyword) return locations

    return locations.filter(
      (location) =>
        location.location_code.toLowerCase().includes(keyword) ||
        location.shelf.toLowerCase().includes(keyword) ||
        location.description.toLowerCase().includes(keyword),
    )
  },
}
