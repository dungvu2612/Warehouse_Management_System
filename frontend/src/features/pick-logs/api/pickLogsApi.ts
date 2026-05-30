/*
Senior Handover Note:
- Purpose: HTTP layer cho module Pick Logs; chi goi endpoint backend, khong chua UI/business logic.
- Dependencies: Su dung shared `http` client de tai su dung auth token/interceptor.
- Maintenance notes: Giu request params typed de tranh sai ten query khi thay doi backend.
- API contract: GET /pick-logs voi params order_id/picked_by/date_from/date_to/limit.
- Audit usage: Chi phuc vu doc lich su thao tac picking de audit va truy vet loi don hang.
*/

import { http } from '../../../shared/lib/http'
import type { PickLog } from '../types/pickLogTypes'

export const pickLogsApi = {
  // Senior Handover: Fetch logs block - goi endpoint GET /pick-logs theo bo loc backend ho tro.
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
