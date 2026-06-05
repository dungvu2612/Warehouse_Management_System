/*
- Mục đích: Hooks cho PDA Stocktaking.
- Phụ thuộc: pdaStocktakingApi.
- Hợp đồng API: scan tray + submit stocktaking.
- Warehouse business rules: UI chi trigger API; tinh atomic va stock transaction do backend dam bao.
- Ghi chú luồng scanner: loading state de chan duplicate scan/submit.
- Ghi chú bảo trì: cach ly API calls khoi component UI.
*/

import { useMutation } from '@tanstack/react-query'
import { pdaStocktakingApi } from '../api/pdaStocktakingApi'

export function usePDAScanTrayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: (qrCode: string) => pdaStocktakingApi.scanTray(qrCode),
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}

export function usePDAStocktakingMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: pdaStocktakingApi.submitStocktaking,
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}
