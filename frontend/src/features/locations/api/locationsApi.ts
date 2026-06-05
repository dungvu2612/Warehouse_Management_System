/*
Thông tin ghi chú:
- File này là API layer thuần HTTP cho module Locations (CRUD).
- Phụ thuộc vào shared `http` client để tái sử dụng auth token/interceptor hiện có.
- Chỉ chứa request/response typed, không đặt business logic UI tại đây.
*/

import { http } from '../../../shared/lib/http'
import type { CreateLocationPayload, Location, LocationTraysResponse, UpdateLocationPayload } from '../types/locationTypes'

export const locationsApi = {
  // Ghi chú: Fetch danh sách location active cho màn list.
  getLocations: async (): Promise<Location[]> => {
    const { data } = await http.get<Location[]>('/locations')
    return data
  },

  getLocationTrays: async (locationId: number): Promise<LocationTraysResponse> => {
    const { data } = await http.get<LocationTraysResponse>(`/locations/${locationId}/trays`)
    return data
  },

  // Ghi chú: Submit payload tạo location mới (backend tự enforce quyền ADMIN).
  createLocation: async (payload: CreateLocationPayload): Promise<Location> => {
    const { data } = await http.post<Location>('/locations', payload)
    return data
  },

  // Ghi chú: Update location theo id.
  updateLocation: async (id: number, payload: UpdateLocationPayload): Promise<Location> => {
    const { data } = await http.put<Location>(`/locations/${id}`, payload)
    return data
  },

  // Ghi chú: Soft delete location theo id.
  deleteLocation: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/locations/${id}`)
    return data
  },
}
