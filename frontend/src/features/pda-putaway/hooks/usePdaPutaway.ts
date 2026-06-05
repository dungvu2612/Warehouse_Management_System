/*
- Mục đích: Mutation hook cho PDA Putaway.
- Phụ thuộc: pdaPutawayApi.
- Hợp đồng API: POST /inventory/putaway.
- Warehouse business rules: frontend khong fake stock transaction, chi goi endpoint nghiep vu.
- Ghi chú luồng scanner: Enter submit nhanh, tranh multi click.
- Ghi chú bảo trì: canh bao loi ngay tren man PDA de thao tac vien sua scan.
*/

import { useMutation } from '@tanstack/react-query'
import { pdaPutawayApi } from '../api/pdaPutawayApi'

export function usePDAPutawayMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  return useMutation({
    mutationFn: pdaPutawayApi.putaway,
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => options?.onError?.(error),
  })
}
