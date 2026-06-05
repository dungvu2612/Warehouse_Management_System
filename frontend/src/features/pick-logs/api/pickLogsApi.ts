/* API client cho pick logs. */

import { http } from '../../../shared/lib/http'
import type { PickLog } from '../types/pickLogTypes'

export const pickLogsApi = {
  getPickLogs: async (params?: {
    order_id?: number
    picked_by?: number
    date_from?: string
    date_to?: string
    limit?: number
  }): Promise<PickLog[]> => {
    const { data } = await http.get<PickLog[]>('/pick-logs', { params })
    return data
  },
}
