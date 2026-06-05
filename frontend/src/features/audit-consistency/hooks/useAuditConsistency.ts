/*
- Mục đích: React Query hook cho panel Audit được nhúng trong Chi tiết đơn.
- Phụ thuộc: auditConsistencyApi.
- Hợp đồng API: GET /audit/consistency/:order_id va endpoint enrich trong adapter.
- Quy tắc nghiệp vụ: Hook chi query chỉ xem audit.
- Ghi chú refactor thay thế: bo hook order options cua standalone audit trang.
- Ghi chú bảo trì: Neu can cache strategy khac, cap nhat query key tai day.
*/

import { useQuery } from '@tanstack/react-query'
import { auditConsistencyApi } from '../api/auditConsistencyApi'

const AUDIT_CONSISTENCY_QUERY_KEY = ['audit-consistency'] as const

export function useAuditConsistencyQuery(orderId: number | null) {
  return useQuery({
    queryKey: [...AUDIT_CONSISTENCY_QUERY_KEY, orderId],
    // Ghi chú: Audit fetch block - lay ket qua doi soat tong hop theo order id.
    queryFn: () => auditConsistencyApi.getAuditConsistency(orderId as number),
    enabled: typeof orderId === 'number' && orderId > 0,
  })
}
