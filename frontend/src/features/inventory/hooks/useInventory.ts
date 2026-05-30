/*
Thong tin handover:
- File nay tap trung React Query hooks cho module Inventory.
- Phu thuoc vao `inventoryService` de giu page sach khoi logic fetch/cache/invalidate.
- Neu them endpoint moi, mo rong query key va invalidate strategy tai day de tranh miss refresh data.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '../services/inventoryService'
import type { InventoryAdjustByTrayPayload, InventoryAdjustPayload, InventoryCreatePayload } from '../types/inventoryTypes'

const INVENTORY_QUERY_KEY = ['inventory'] as const
const INVENTORY_PRODUCTS_QUERY_KEY = ['inventory-products'] as const
const INVENTORY_TRAYS_QUERY_KEY = ['inventory-trays'] as const
const INVENTORY_LOCATIONS_QUERY_KEY = ['inventory-locations'] as const

export function useInventoryQuery() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY,
    // Senior Handover: Block fetch inventory list.
    queryFn: inventoryService.getInventory,
  })
}

export function useInventoryProductsQuery() {
  return useQuery({
    queryKey: INVENTORY_PRODUCTS_QUERY_KEY,
    queryFn: inventoryService.getProductOptions,
  })
}

export function useInventoryTraysQuery() {
  return useQuery({
    queryKey: INVENTORY_TRAYS_QUERY_KEY,
    queryFn: inventoryService.getTrayOptions,
  })
}

export function useInventoryLocationsQuery() {
  return useQuery({
    queryKey: INVENTORY_LOCATIONS_QUERY_KEY,
    queryFn: inventoryService.getLocationOptions,
  })
}

async function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: INVENTORY_PRODUCTS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: INVENTORY_TRAYS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: INVENTORY_LOCATIONS_QUERY_KEY }),
  ])
}

export function useCreateInventoryMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block tao ton ban dau (POST /inventory).
    mutationFn: (payload: InventoryCreatePayload) => inventoryService.createInventory(payload),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useAdjustInventoryMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block adjust ton kho (PATCH /inventory/:id/adjust).
    mutationFn: ({ id, payload }: { id: number; payload: InventoryAdjustPayload }) =>
      inventoryService.adjustInventory(id, payload),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useAdjustInventoryByTrayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Senior Handover: Block adjust ton theo tray QR (POST /inventory/adjust-by-tray).
    mutationFn: (payload: InventoryAdjustByTrayPayload) => inventoryService.adjustInventoryByTray(payload),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useScanInventoryTrayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    // Senior Handover: scanner input entry - scan tray QR de auto fill inventory adjust modal.
    mutationFn: (trayQRCode: string) => inventoryService.scanTrayByQRCode(trayQRCode),
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}
