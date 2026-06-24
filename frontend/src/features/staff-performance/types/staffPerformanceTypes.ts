export type StaffPerformanceWorkType = 'all' | 'picking' | 'import'

export interface StaffPerformanceItem {
  staff_id: number
  staff_name: string
  picking_task_count: number
  picked_quantity: number
  import_task_count: number
  imported_quantity: number
  total_task_count: number
  total_quantity: number
  weighted_total_quantity: number
  performance_score: number
}

export interface StaffPerformanceResponse {
  from_date: string
  to_date: string
  items: StaffPerformanceItem[]
}

export interface StaffPerformanceFilters {
  from_date: string
  to_date: string
  work_type: StaffPerformanceWorkType
}
