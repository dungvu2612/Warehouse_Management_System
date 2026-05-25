/*
Mo ta file:
- React Query hooks cho module BOM.
- Hooks chi quan ly cache/loading/error/invalidate, khong chua business logic.

Luong xu ly:
1) Hooks goi service layer (khong goi API truc tiep).
2) Service tra data typed cho hooks.
3) Mutation invalidate query keys sau khi thao tac thanh cong.

Luu y khi sua:
- Query keys la contract noi bo, doi key phai doi dong bo invalidate.
- Nghiệp vụ (filter/transform) dua vao services de giu hooks gon.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bomService } from '../services/bomService'
import type { BOMPayload } from '../types/bomTypes'

// Query keys trung tam cua module BOM.
const BOMS_QUERY_KEY = ['boms'] as const
const BOM_ITEMS_QUERY_KEY = ['bom-items'] as const
const BOM_PARENT_OPTIONS_QUERY_KEY = ['bom-parent-options'] as const
const BOM_COMPONENT_OPTIONS_QUERY_KEY = ['bom-component-options'] as const

// Query danh sach BOM.
export function useBOMsQuery() {
  return useQuery({
    queryKey: BOMS_QUERY_KEY,
    queryFn: () => bomService.getBOMs(),
  })
}

// Query chi tiet items cua 1 BOM theo bomId.
export function useBOMItemsQuery(bomId: number | null) {
  return useQuery({
    queryKey: [...BOM_ITEMS_QUERY_KEY, bomId],
    queryFn: () => bomService.getBOMItems(bomId as number),
    enabled: typeof bomId === 'number' && bomId > 0,
  })
}

// Query options san pham cha (FINISHED_GOOD).
export function useBOMParentProductsQuery() {
  return useQuery({
    queryKey: BOM_PARENT_OPTIONS_QUERY_KEY,
    queryFn: () => bomService.getProductsByType('FINISHED_GOOD'),
  })
}

// Query options linh kien thanh phan (COMPONENT).
export function useBOMComponentProductsQuery() {
  return useQuery({
    queryKey: BOM_COMPONENT_OPTIONS_QUERY_KEY,
    queryFn: () => bomService.getProductsByType('COMPONENT'),
  })
}

function invalidateBOMQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: BOMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: BOM_ITEMS_QUERY_KEY }),
  ])
}

// Mutation tao BOM.
export function useCreateBOMMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BOMPayload) => bomService.createBOM(payload),
    onSuccess: async () => {
      await invalidateBOMQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

// Mutation cap nhat BOM.
export function useUpdateBOMMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BOMPayload }) =>
      bomService.updateBOM(id, payload),
    onSuccess: async () => {
      await invalidateBOMQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

// Mutation xoa BOM.
export function useDeleteBOMMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => bomService.deleteBOM(id),
    onSuccess: async () => {
      await invalidateBOMQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}
