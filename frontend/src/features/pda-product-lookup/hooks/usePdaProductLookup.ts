/*
Senior Handover Note:
- Purpose: React Query hook cho PDA Product Lookup.
- Dependencies: pdaProductLookupApi.
- API contract: scan product by QR.
- Warehouse business rules: read-only lookup mode.
- Scanner workflow notes: Enter submit, loading state de tranh scan duplicate.
- Maintenance notes: hook nay intentionally don gian de giu toc do man PDA.
*/

import { useMutation } from '@tanstack/react-query'
import { pdaProductLookupApi } from '../api/pdaProductLookupApi'

export function usePDAProductLookupMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: (qrCode: string) => pdaProductLookupApi.scanProduct(qrCode),
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}
