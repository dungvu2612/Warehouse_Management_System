/*
- Mục đích: API layer cho module Staff Tasks.
- Phụ thuộc: shared http client.
- Hợp đồng API: GET /staff/tasks.
- Quy tắc nghiệp vụ: Chi lay order can picking (PENDING/PICKING), khong co mutation o day.
- Ghi chú refactor thay thế: replacement refactor, no duplicate picking flow.
- Ghi chú luồng scanner: staff list la diem vao cho scan order va picking detail.
- Ghi chú phân quyền: endpoint yeu cau role ADMIN/WAREHOUSE.
- Ghi chú bảo trì: Neu endpoint doi path, cap nhat file nay.
*/

import { http } from '../../../shared/lib/http'
import type { StaffTaskItem } from '../types/staffTasks.types'

export const staffTasksApi = {
  getTasks: async (): Promise<StaffTaskItem[]> => {
    const { data } = await http.get<StaffTaskItem[]>('/staff/tasks')
    return data
  },
}
