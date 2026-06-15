/*
Thông tin ghi chú:
- File nay tap trung React Query hooks cho module Import Receipts.
- Phu thuoc vao `importReceiptsService` de giu trang sach khoi logic fetch/cache/invalidate.
- Query key va invalidate strategy tai day da bao phu list/detail/create.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { importReceiptsService } from '../services/importReceiptsService'
import type { CreateImportReceiptPayload } from '../types/importReceiptTypes'

const IMPORT_RECEIPTS_QUERY_KEY = ['import-receipts'] as const
const IMPORT_RECEIPT_DETAIL_QUERY_KEY = ['import-receipt-detail'] as const
const IMPORT_RECEIPT_PRODUCTS_QUERY_KEY = ['import-receipt-products'] as const
const IMPORT_RECEIPT_TRAYS_QUERY_KEY = ['import-receipt-trays'] as const
const IMPORT_RECEIPT_LOCATIONS_QUERY_KEY = ['import-receipt-locations'] as const
const PUTAWAY_REQUESTS_QUERY_KEY = ['putaway-requests'] as const

export function useImportReceiptsQuery() {
  return useQuery({
    queryKey: IMPORT_RECEIPTS_QUERY_KEY,
    // Ghi chú: Block fetch danh sach phieu nhap.
    queryFn: importReceiptsService.getImportReceipts,
  })
}

export function useImportReceiptDetailQuery(receiptId: number | null) {
  return useQuery({
    queryKey: [...IMPORT_RECEIPT_DETAIL_QUERY_KEY, receiptId],
    // Ghi chú: Block fetch chi tiet phieu nhap, chi goi khi da co id hop le.
    queryFn: () => importReceiptsService.getImportReceiptById(Number(receiptId)),
    enabled: Boolean(receiptId && receiptId > 0),
  })
}

export function useImportReceiptProductsQuery() {
  return useQuery({
    queryKey: IMPORT_RECEIPT_PRODUCTS_QUERY_KEY,
    queryFn: importReceiptsService.getProductOptions,
  })
}

export function useImportReceiptTraysQuery() {
  return useQuery({
    queryKey: IMPORT_RECEIPT_TRAYS_QUERY_KEY,
    queryFn: importReceiptsService.getTrayOptions,
  })
}

export function useImportReceiptLocationsQuery() {
  return useQuery({
    queryKey: IMPORT_RECEIPT_LOCATIONS_QUERY_KEY,
    queryFn: importReceiptsService.getLocationOptions,
  })
}

export function usePutawayRequestsQuery(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING') {
  return useQuery({
    queryKey: [...PUTAWAY_REQUESTS_QUERY_KEY, status],
    queryFn: () => importReceiptsService.getPutawayRequests(status),
  })
}

async function invalidateImportReceiptQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: IMPORT_RECEIPTS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: IMPORT_RECEIPT_DETAIL_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: IMPORT_RECEIPT_PRODUCTS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: IMPORT_RECEIPT_TRAYS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: IMPORT_RECEIPT_LOCATIONS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: PUTAWAY_REQUESTS_QUERY_KEY }),
  ])
}

export function useCreateImportReceiptMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    // Ghi chú: Block submit tao phieu nhap.
    mutationFn: (payload: CreateImportReceiptPayload) => importReceiptsService.createImportReceipt(payload),
    onSuccess: async () => {
      // Ghi chú: Khối làm mới dữ liệu - invalidate list/detail/options sau khi tạo thành công.
      await invalidateImportReceiptQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useAssignImportReceiptItemMutation(options?: {
  onSuccess?: (message: string) => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, staffId }: { itemId: number; staffId: number }) =>
      importReceiptsService.assignImportReceiptItem(itemId, staffId),
    onSuccess: async (response) => {
      await invalidateImportReceiptQueries(queryClient)
      await queryClient.invalidateQueries({ queryKey: ['staff-import-tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] })
      options?.onSuccess?.(response.message)
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useUnassignImportReceiptItemMutation(options?: {
  onSuccess?: (message: string) => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: number) => importReceiptsService.unassignImportReceiptItem(itemId),
    onSuccess: async (response) => {
      await invalidateImportReceiptQueries(queryClient)
      await queryClient.invalidateQueries({ queryKey: ['staff-import-tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] })
      options?.onSuccess?.(response.message)
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useApprovePutawayRequestMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => importReceiptsService.approvePutawayRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PUTAWAY_REQUESTS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: IMPORT_RECEIPTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useRejectPutawayRequestMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      importReceiptsService.rejectPutawayRequest(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PUTAWAY_REQUESTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}
