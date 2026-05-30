/*
Senior Handover Note:
- Purpose: Dinh nghia contracts TypeScript cho man Audit Consistency va cac section hien thi ket qua doi soat workflow kho.
- Dependencies: Dung boi api/service/hooks/components/pages trong `features/audit-consistency` va component Pick Logs reusable.
- Audit logic: Type bao phu order, picking, inventory, stock transactions, pick logs va danh sach issues.
- API assumptions: Endpoint chinh GET /audit/consistency/:order_id co the toi gian; frontend adapter se bo sung truong thong tin thieu.
- Maintenance notes: Khi backend bo sung/doi contract audit, cap nhat type tai day de compile canh bao cac diem anh huong.
*/

export type AuditSeverity = 'WARNING' | 'ERROR' | 'CRITICAL'

export type AuditOverallStatus = 'OK' | 'WARNING' | 'ERROR'

export interface AuditIssue {
  id: string
  severity: AuditSeverity
  source: 'ORDER' | 'PICKING' | 'PICK_LOGS' | 'INVENTORY' | 'STOCK_TX'
  title: string
  message: string
}

export interface AuditWarning {
  id: string
  source: AuditIssue['source']
  message: string
}

export interface AuditSummary {
  overall_status: AuditOverallStatus
  checked_at: string
  issue_count: number
  warning_count: number
  error_count: number
  critical_count: number
  headline: string
}

export interface AuditOrderSummary {
  order_id: number
  order_code: string
  customer: string
  status: string
  total_amount: number | null
  created_at: string
}

export interface AuditPickingValidation {
  picking_task_count: number
  picked_quantity: number
  required_quantity: number
  missing_quantity: number
  duplicated_picking: number
  tray_mismatch: number
}

export interface AuditInventoryBeforeAfterRow {
  key: string
  product_code: string
  product_name: string
  tray_code: string
  before_quantity: number | null
  after_quantity: number | null
  current_inventory_quantity: number | null
  picked_quantity: number
  export_quantity: number
}

export interface AuditInventoryValidation {
  inventory_deducted_correctly: boolean | null
  stock_transaction_matched: boolean | null
  pick_logs_total_qty: number
  export_tx_total_qty: number
  before_after_rows: AuditInventoryBeforeAfterRow[]
  fallback_note: string | null
}

export interface AuditPickLogEntry {
  id: number
  order_code: string
  product_code: string
  product_name: string
  tray_code: string
  picked_quantity: number
  picked_by: string
  picked_at: string
  note: string
  status: 'PICKED'
  verified: boolean
}

export interface AuditConsistencyResult {
  summary: AuditSummary
  order_summary: AuditOrderSummary
  picking_validation: AuditPickingValidation
  inventory_validation: AuditInventoryValidation
  issues: AuditIssue[]
  warnings: AuditWarning[]
  pick_logs: AuditPickLogEntry[]
}
