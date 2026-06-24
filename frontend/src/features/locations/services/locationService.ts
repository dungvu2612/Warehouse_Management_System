/*
Thông tin ghi chú:
- File này là service layer của module Locations, đứng giữa hooks và API layer (CRUD).
- Phụ thuộc vào `locationsApi` để thao tác dữ liệu và export helper lọc danh sách cho trang.
- Không đưa React state vào đây; chỉ giữ use-case dùng chung để trang/components tái sử dụng.
*/

import { locationsApi } from '../api/locationsApi'
import type { CreateLocationPayload, Location, LocationTraysResponse, UpdateLocationPayload } from '../types/locationTypes'

function sortLocationsNewestFirst(locations: Location[]): Location[] {
  return [...locations].sort((a, b) => b.id - a.id)
}

export const locationService = {
  // Ghi chú: Lấy danh sách location từ backend.
  getLocations: async (): Promise<Location[]> => {
    const locations = await locationsApi.getLocations()
    return sortLocationsNewestFirst(locations)
  },

  getLocationTrays: async (locationId: number): Promise<LocationTraysResponse> => {
    return locationsApi.getLocationTrays(locationId)
  },

  // Ghi chú: Tạo location mới thông qua API layer.
  createLocation: async (payload: CreateLocationPayload): Promise<Location> => {
    return locationsApi.createLocation(payload)
  },

  // Ghi chú: Cập nhật location theo id.
  updateLocation: async (id: number, payload: UpdateLocationPayload): Promise<Location> => {
    return locationsApi.updateLocation(id, payload)
  },

  // Ghi chú: Xóa mềm location theo id.
  deleteLocation: async (id: number): Promise<{ message: string }> => {
    return locationsApi.deleteLocation(id)
  },

  // Ghi chú: Lọc cục bộ theo mã vị trí, shelf, mô tả để UX tìm kiếm nhanh.
  filterLocationsByKeyword: (locations: Location[], keywordRaw: string): Location[] => {
    const keyword = keywordRaw.trim().toLowerCase()
    const newestFirst = sortLocationsNewestFirst(locations)
    if (!keyword) return newestFirst

    return newestFirst.filter(
      (location) =>
        location.location_code.toLowerCase().includes(keyword) ||
        location.shelf.toLowerCase().includes(keyword) ||
        location.description.toLowerCase().includes(keyword),
    )
  },
}
