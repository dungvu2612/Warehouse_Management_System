/*
- Mục đích: React Query hook cho PDA Product Lookup.
- Phụ thuộc: pdaProductLookupApi.
- Hợp đồng API: scan product by QR.
- Warehouse business rules: chỉ xem lookup mode.
- Ghi chú luồng scanner: Enter submit, loading state de tranh scan duplicate.
- Ghi chú bảo trì: hook nay intentionally don gian de giu toc do man PDA.
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
