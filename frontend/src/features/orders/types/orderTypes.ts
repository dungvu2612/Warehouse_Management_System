/*
Mo ta file:
- Dinh nghia toan bo data contracts TypeScript cho module Orders/Picking.
- File nay la nguon su that ve shape du lieu giua FE va BE, tranh dung any.

Luong xu ly:
1) Api/Service/Hooks/Components import type tu day.
2) Khi backend doi contract JSON, cap nhat file nay truoc de compile canh bao cac diem anh huong.
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
  created_at: string
  updated_at: string
}

export interface OrderDetailPickingTask {
  id: number
  order_id: number
  product_id: number
  product_code: string
  product_name: string
  tray_id: number
  tray_code: string
  location_code: string
  required_quantity: number
  picked_quantity: number
  inventory_qty: number
  status: PickingStatus
  verified: boolean
}

export interface OrderProgress {
  order_id: number
  order_status: OrderStatus
  done_tasks: number
  total_tasks: number
  progress: number
}

export interface OrderShortageItem {
  picking_task_id: number
  product_id: number
  required_qty: number
  picked_qty: number
  missing_qty: number
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

export interface OrderFinishResponse {
  message: string
  order: Order
  shortage: {
    has_shortage: boolean
    items: OrderShortageItem[]
  }
}

export interface ScanOrderResponse {
  message: string
  order: Order
  tasks: PickingTask[]
}

export interface PickingTasksResponse {
  order_id: number
  status: OrderStatus
  tasks: PickingTask[]
}

export interface ConfirmPickingResponse {
  message: string
  task: PickingTask
  remaining_quantity: number
}

export interface OrderCreatePayload {
  bom_id: number
  machine_qty: number
  customer_name: string
}

export interface ScanOrderPayload {
  order_code: string
}

export interface ConfirmPickingPayload {
  tray_code: string
  quantity: number
  note?: string
}

// Option toi gian de render combobox chon BOM khi tao order.
export interface BOMOption {
  id: number
  product_id: number
  bom_name: string
  description: string
  product?: {
    id: number
    product_code: string
    product_name: string
  }
}
