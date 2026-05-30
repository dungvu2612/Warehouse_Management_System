/*
Senior Handover Note:
- Purpose: Hooks cho PDA Stocktaking.
- Dependencies: pdaStocktakingApi.
- API contract: scan tray + submit stocktaking.
- Warehouse business rules: UI chi trigger API; tinh atomic va stock transaction do backend dam bao.
- Scanner workflow notes: loading state de chan duplicate scan/submit.
- Maintenance notes: cach ly API calls khoi component UI.
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
