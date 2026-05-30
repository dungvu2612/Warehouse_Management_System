/*
Senior Handover Note:
- Purpose: Mutation hook cho PDA Putaway.
- Dependencies: pdaPutawayApi.
- API contract: POST /inventory/putaway.
- Warehouse business rules: frontend khong fake stock transaction, chi goi endpoint nghiep vu.
- Scanner workflow notes: Enter submit nhanh, tranh multi click.
- Maintenance notes: canh bao loi ngay tren man PDA de thao tac vien sua scan.
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
