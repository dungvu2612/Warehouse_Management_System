/*
Senior Handover Note:
- Purpose: React Query hook cho Order Audit panel embedded trong Order Detail.
- Dependencies: auditConsistencyApi.
- API contract: GET /audit/consistency/:order_id va endpoint enrich trong adapter.
- Business rules: Hook chi query read-only audit.
- Replacement refactor notes: bo hook order options cua standalone audit page.
- Maintenance notes: Neu can cache strategy khac, cap nhat query key tai day.
*/

import { useQuery } from '@tanstack/react-query'
import { auditConsistencyApi } from '../api/auditConsistencyApi'

const AUDIT_CONSISTENCY_QUERY_KEY = ['audit-consistency'] as const

export function useAuditConsistencyQuery(orderId: number | null) {
  return useQuery({
    queryKey: [...AUDIT_CONSISTENCY_QUERY_KEY, orderId],
    // Senior Handover: Audit fetch block - lay ket qua doi soat tong hop theo order id.
    queryFn: () => auditConsistencyApi.getAuditConsistency(orderId as number),
    enabled: typeof orderId === 'number' && orderId > 0,
  })
}
