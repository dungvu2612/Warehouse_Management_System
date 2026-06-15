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

export type StaffTaskStatus = 'WAITING' | 'PICKING'

export interface StaffTaskItem {
  id: number
  order_code: string
  customer_name: string
  customer_phone: string
  customer_address: string
  status: StaffTaskStatus
  total_items: number
  picked_items: number
  assigned_to?: number | null
  assignee_name?: string
  assignee_username?: string
  created_at: string
}

export interface StaffTaskSummary {
  waiting_count: number
  picking_count: number
  my_picking_count: number
  picking_waiting_count?: number
  picking_in_progress_count?: number
  import_waiting_count?: number
  import_in_progress_count?: number
}

export interface ClaimStaffTaskResponse {
  message: string
  order_id: number
  assigned_to: number
}

export type ImportTaskStatus = 'WAITING' | 'IMPORTING' | 'PARTIAL' | 'DONE'

export interface StaffImportTaskItem {
  id: number
  receipt_id: number
  receipt_code: string
  supplier_name: string
  product_id: number
  product_code: string
  product_name: string
  product_image_url: string
  expected_quantity: number
  actual_quantity: number
  actual_tray_id: number | null
  actual_tray_code: string
  status: ImportTaskStatus
  assigned_to?: number | null
  assignee_name?: string
  assignee_username?: string
  assigned_at?: string | null
  completed_at?: string | null
  created_at: string
}

export interface ClaimImportTaskResponse {
  message: string
  item: unknown
}

export interface ConfirmImportTaskPayload {
  tray_code?: string
  tray_id?: number
  quantity: number
  note?: string
}

export interface ConfirmImportTaskResponse {
  message: string
  item: unknown
}
