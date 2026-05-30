/*
Senior Handover Note:
- Purpose: API layer cho module Staff Tasks.
- Dependencies: shared http client.
- API contract: GET /staff/tasks.
- Business rules: Chi lay order can picking (PENDING/PICKING), khong co mutation o day.
- Replacement refactor notes: replacement refactor, no duplicate picking flow.
- Scanner workflow notes: staff list la diem vao cho scan order va picking detail.
- Permission notes: endpoint yeu cau role ADMIN/WAREHOUSE.
- Maintenance notes: Neu endpoint doi path, cap nhat file nay.
*/

import { http } from '../../../shared/lib/http'
import type { StaffTaskItem } from '../types/staffTasks.types'

export const staffTasksApi = {
  getTasks: async (): Promise<StaffTaskItem[]> => {
    const { data } = await http.get<StaffTaskItem[]>('/staff/tasks')
    return data
  },
}
