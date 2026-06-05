/* Type cho dữ liệu pick logs trả về từ backend. */

export interface PickLogUser {
  id: number
  username: string
  full_name?: string
}

export interface PickLog {
  id: number
  picking_task_id: number | null
  order_id: number | null
  product_id: number | null
  tray_id: number | null
  picked_quantity: number
  picked_by: number | null
  picker?: PickLogUser | null
  picked_at: string
  note: string
}

export interface PickLogItem extends PickLog {}

export interface PickLogDisplayItem extends PickLog {
  order_code: string
  product_code: string
  product_name: string
  tray_code: string
  picked_by_label: string
  picked_status: 'PICKED'
  verified: boolean
}

export interface PickLogFilterValues {
  product: string | 'ALL'
  tray: string | 'ALL'
  picker: string | 'ALL'
  searchKeyword: string
}
