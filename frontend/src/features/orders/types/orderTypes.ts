/*
- Mục đích: Hợp đồng dữ liệu TypeScript cho module Orders (list/detail/chỉ xem).
- Phụ thuộc: Dung boi orders api/service/hooks/pages va module audit/pda.
- Hợp đồng API: Shape mapping theo GET /orders va GET /orders/:id.
- Quy tắc nghiệp vụ: Orders module khong chua payload mutation picking sau replacement refactor.
- Ghi chú refactor thay thế: Loai bo types mutation create/scan/confirm/finish cu trong module orders.
- Ghi chú bảo trì: Khi backend doi contract detail/list, cap nhat file nay truoc de compiler canh bao diem anh huong.
*/

export type OrderStatus = 'PENDING' | 'PICKING' | 'COMPLETED' | 'CANCELLED'

export type PickingStatus = 'WAITING' | 'PICKING' | 'DONE' | 'CANCELLED'

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_code: string
  customer_name: string
  customer_phone?: string
  customer_address?: string
  status: OrderStatus
  total_amount: number
  qr_code: string
  created_by?: number | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface PickingTask {
  id: number
  order_id: number
  product_id: number
  tray_id: number
  required_quantity: number
  picked_quantity: number
  verified: boolean
  status: PickingStatus
  assigned_to?: number | null
  assigned_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface OrderDetailPickingTask {
  id: number
  order_id: number
  product_id: number
  product_code: string
  product_name: string
  product_image_url?: string
  tray_id: number
  tray_code: string
  location_code: string
  required_quantity: number
  picked_quantity: number
  inventory_qty: number
  status: PickingStatus
  verified: boolean
  assigned_to?: number | null
  assigned_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  assignee_name?: string
  assignee_username?: string
}

export interface OrderDetailShortageItem {
  picking_task_id: number
  product_id: number
  product_code: string
  product_name: string
  location_code: string
  required_qty: number
  picked_qty: number
  available_qty: number
  missing_qty: number
}

export interface OrderDetailResponse {
  order: Order
  picking_tasks: OrderDetailPickingTask[]
  progress: {
    total_tasks: number
    done_tasks: number
    percent: number
  }
  shortage: {
    has_shortage: boolean
    items: OrderDetailShortageItem[]
  }
}

export interface OrderShortagePreviewItem {
  product_id: number
  product_code: string
  product_name: string
  required_qty: number
  available_qty: number
  missing_qty: number
}

export interface OrderShortagePreviewResponse {
  has_shortage: boolean
  items: OrderShortagePreviewItem[]
}

export interface ScanOrderResponse {
  message: string
  order: Order
  tasks: PickingTask[]
}
