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
import type {
  ClaimImportTaskResponse,
  ClaimStaffTaskResponse,
  ConfirmImportTaskPayload,
  ConfirmImportTaskResponse,
  StaffImportTaskItem,
  StaffTaskItem,
  StaffTaskSummary,
} from '../types/staffTasks.types'

export const staffTasksApi = {
  getTasks: async (): Promise<StaffTaskItem[]> => {
    const { data } = await http.get<StaffTaskItem[]>('/staff/tasks')
    return data
  },

  getSummary: async (): Promise<StaffTaskSummary> => {
    const { data } = await http.get<StaffTaskSummary>('/staff/task-summary')
    return data
  },

  claimOrder: async (orderId: number): Promise<ClaimStaffTaskResponse> => {
    const { data } = await http.post<ClaimStaffTaskResponse>(`/staff/orders/${orderId}/claim`)
    return data
  },

  getImportTasks: async (): Promise<StaffImportTaskItem[]> => {
    const { data } = await http.get<StaffImportTaskItem[]>('/staff/import-receipt-items')
    return data
  },

  claimImportItem: async (itemId: number): Promise<ClaimImportTaskResponse> => {
    const { data } = await http.post<ClaimImportTaskResponse>(`/staff/import-receipt-items/${itemId}/claim`)
    return data
  },

  confirmImportItem: async ({
    itemId,
    payload,
  }: {
    itemId: number
    payload: ConfirmImportTaskPayload
  }): Promise<ConfirmImportTaskResponse> => {
    const { data } = await http.post<ConfirmImportTaskResponse>(
      `/staff/import-receipt-items/${itemId}/confirm`,
      payload,
    )
    return data
  },
}
