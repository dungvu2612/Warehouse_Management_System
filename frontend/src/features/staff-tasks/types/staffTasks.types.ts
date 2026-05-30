/*
Senior Handover Note:
- Purpose: Type contracts cho module Staff Tasks.
- Dependencies: Dung boi api/hooks/components/pages cua staff-tasks.
- API contract: GET /staff/tasks tra danh sach order PENDING/PICKING.
- Business rules: staff task list is the entry point for warehouse workers.
- Replacement refactor notes: replacement refactor, no duplicate picking flow.
- Scanner workflow notes: task list cho phep mo nhanh flow scan order/picking detail.
- Permission notes: ADMIN + WAREHOUSE duoc thao tac, VIEWER read-only dashboard.
- Maintenance notes: Khi backend bo sung field task list, cap nhat type nay truoc.
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
