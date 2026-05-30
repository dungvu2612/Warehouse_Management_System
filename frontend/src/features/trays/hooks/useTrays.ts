/*
Thong tin handover:
- File nay tap trung React Query hooks cho module Trays.
- Phu thuoc vao `trayService` de giu page sach khoi logic fetch/cache/invalidate.
- Query key va invalidate strategy tai day da bao phu create/update/delete.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trayService } from '../services/trayService'
import type { TrayPayload } from '../types/trayTypes'

const TRAYS_QUERY_KEY = ['trays'] as const
const TRAY_PRODUCTS_QUERY_KEY = ['tray-products'] as const
const TRAY_LOCATIONS_QUERY_KEY = ['tray-locations'] as const

export function useTraysQuery() {
  return useQuery({
    queryKey: TRAYS_QUERY_KEY,
    // Senior Handover: Block fetch danh sach trays.
    queryFn: trayService.getTrays,
  })
}

export function useTrayProductOptionsQuery() {
  return useQuery({
    queryKey: TRAY_PRODUCTS_QUERY_KEY,
    queryFn: trayService.getProductOptions,
  })
}

export function useTrayLocationOptionsQuery() {
  return useQuery({
    queryKey: TRAY_LOCATIONS_QUERY_KEY,
    queryFn: trayService.getLocationOptions,
  })
}

export function useCreateTrayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block submit tao tray moi.
    mutationFn: (payload: TrayPayload) => trayService.createTray(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRAYS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useUpdateTrayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block submit cap nhat tray.
    mutationFn: ({ id, payload }: { id: number; payload: TrayPayload }) =>
      trayService.updateTray(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRAYS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useDeleteTrayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block submit xoa mem tray.
    mutationFn: (id: number) => trayService.deleteTray(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRAYS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}
