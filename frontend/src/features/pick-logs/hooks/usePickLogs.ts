/*
Senior Handover Note:
- Purpose: React Query hooks cho module Pick Logs.
- Dependencies: Phu thuoc vao pickLogsService de tach fetch/mapping logic khoi page/component.
- Maintenance notes: Query key can on dinh theo order filter de cache dung ngu canh Order Detail.
- API contract: Trigger GET /pick-logs qua service layer.
- Audit usage: Hook nay chi doc du lieu phuc vu audit/truy vet, khong co mutation.
*/

import { useQuery } from '@tanstack/react-query'
import { pickLogsService } from '../services/pickLogsService'

const PICK_LOGS_QUERY_KEY = ['pick-logs'] as const

export function usePickLogsQuery(params?: { orderId?: number; limit?: number }) {
  return useQuery({
    queryKey: [...PICK_LOGS_QUERY_KEY, params?.orderId || 'ALL', params?.limit || 100],
    // Senior Handover: Fetch logs block - load pick logs theo order_id de nhung vao Order Detail.
    queryFn: () => pickLogsService.getPickLogs({ order_id: params?.orderId, limit: params?.limit || 100 }),
    enabled: !params?.orderId || params.orderId > 0,
  })
}
