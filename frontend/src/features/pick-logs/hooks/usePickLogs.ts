/* React Query hooks cho pick logs. */

import { useQuery } from '@tanstack/react-query'
import { pickLogsService } from '../services/pickLogsService'

const PICK_LOGS_QUERY_KEY = ['pick-logs'] as const

export function usePickLogsQuery(params?: { orderId?: number; limit?: number }) {
  return useQuery({
    queryKey: [...PICK_LOGS_QUERY_KEY, params?.orderId || 'ALL', params?.limit || 100],
    queryFn: () => pickLogsService.getPickLogs({ order_id: params?.orderId, limit: params?.limit || 100 }),
    enabled: !params?.orderId || params.orderId > 0,
  })
}
