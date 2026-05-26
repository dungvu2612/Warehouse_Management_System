/*
Senior Handover Note:
- File này là API layer thuần HTTP cho module Locations (CRUD).
- Phụ thuộc vào shared `http` client để tái sử dụng auth token/interceptor hiện có.
- Chỉ chứa request/response typed, không đặt business logic UI tại đây.
*/

import { http } from '../../../shared/lib/http'
import type { CreateLocationPayload, Location, UpdateLocationPayload } from '../types/locationTypes'

export const locationsApi = {
  // Senior Handover: Fetch danh sách location active cho màn list.
  getLocations: async (): Promise<Location[]> => {
    const { data } = await http.get<Location[]>('/locations')
    return data
  },

  // Senior Handover: Submit payload tạo location mới (backend tự enforce quyền ADMIN).
  createLocation: async (payload: CreateLocationPayload): Promise<Location> => {
    const { data } = await http.post<Location>('/locations', payload)
    return data
  },

  // Senior Handover: Update location theo id.
  updateLocation: async (id: number, payload: UpdateLocationPayload): Promise<Location> => {
    const { data } = await http.put<Location>(`/locations/${id}`, payload)
    return data
  },

  // Senior Handover: Soft delete location theo id.
  deleteLocation: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/locations/${id}`)
    return data
  },
}
