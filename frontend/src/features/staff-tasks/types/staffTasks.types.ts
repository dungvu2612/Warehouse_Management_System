/*
- Mục đích: Type contracts cho module Staff Tasks.
- Phụ thuộc: Dung boi api/hooks/components/pages cua staff-tasks.
- Hợp đồng API: GET /staff/tasks tra danh sach order PENDING/PICKING.
- Quy tắc nghiệp vụ: danh sách tác vụ staff là điểm vào cho nhân viên kho.
- Ghi chú refactor thay thế: replacement refactor, no duplicate picking flow.
- Ghi chú luồng scanner: task list cho phep mo nhanh flow scan order/picking detail.
- Ghi chú phân quyền: ADMIN + WAREHOUSE duoc thao tac.
- Ghi chú bảo trì: Khi backend bo sung field task list, cap nhat type nay truoc.
*/

export type StaffTaskStatus = 'PENDING' | 'PICKING'

export interface StaffTaskItem {
  id: number
  order_code: string
  customer_name: string
  customer_phone: string
  customer_address: string
  status: StaffTaskStatus
  total_items: number
  picked_items: number
  created_at: string
}
