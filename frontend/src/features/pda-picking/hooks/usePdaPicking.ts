/*
Senior Handover Note:
- Purpose: React Query hooks cho PDA Picking replacement flow.
- Dependencies: pdaPickingApi.
- API contract: scan order + detail + verify tray + scan product.
- Business rules: Sau moi scan product can refresh state de cap nhat remaining qty realtime.
- Replacement refactor notes: bo mutation confirm quantity cu.
- Scanner workflow notes: Hook tra loading state de khoa scanner action khi request dang chay.
- Maintenance notes: query key tach rieng theo order/task context de de invalidate.
*/

import { useMutation } from '@tanstack/react-query'
import { pdaPickingApi } from '../api/pdaPickingApi'

export function usePDAScanOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: (qrCode: string) => pdaPickingApi.scanOrder(qrCode),
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}

export function usePDAOrderDetailMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: (orderID: number) => pdaPickingApi.getOrderDetail(orderID),
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}

export function usePDAVerifyTrayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: pdaPickingApi.verifyTray,
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}

export function usePDAScanProductMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: pdaPickingApi.scanProduct,
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}
