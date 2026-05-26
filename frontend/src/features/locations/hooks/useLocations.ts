/*
Senior Handover Note:
- File này tập trung React Query hooks cho module Locations.
- Phụ thuộc vào `locationService` để giữ page sạch khỏi logic data-fetch/cache.
- Query key và invalidate strategy tại file này đã bao phủ create/update/delete.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { locationService } from '../services/locationService'
import type { CreateLocationPayload, UpdateLocationPayload } from '../types/locationTypes'

const LOCATIONS_QUERY_KEY = ['locations'] as const

export function useLocationsQuery() {
  return useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    // Senior Handover: Block fetch danh sách locations cho màn hình list.
    queryFn: locationService.getLocations,
  })
}

export function useCreateLocationMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block submit tạo location mới.
    mutationFn: (payload: CreateLocationPayload) => locationService.createLocation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useUpdateLocationMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block submit cập nhật location.
    mutationFn: ({ id, payload }: { id: number; payload: UpdateLocationPayload }) =>
      locationService.updateLocation(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useDeleteLocationMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block submit xóa mềm location.
    mutationFn: (id: number) => locationService.deleteLocation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}
