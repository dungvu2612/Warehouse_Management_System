/*
Senior Handover Note:
- Purpose: Type contracts cho PDA Picking replacement flow scan tray + scan product QR tung lan.
- Dependencies: Dung chung order types va API /orders/scan/:qr_code, /orders/picking-tasks/:id/verify-tray, /orders/picking-tasks/:id/scan-product.
- API contract: Scan order tra order + tasks; verify/scan-product tra task + remaining_quantity.
- Business rules: Product QR scan hop le se tang picked_quantity dung 1 don vi.
- Replacement refactor notes: Loai bo flow manual quantity confirm cho WAREHOUSE.
- Scanner workflow notes: HT730 keyboard wedge scan -> Enter -> submit API.
- Maintenance notes: Neu backend doi shape task/order, cap nhat type nay va API layer mapper.
*/

import type { PickingTask, ScanOrderResponse, OrderDetailResponse } from '../../orders/types/orderTypes'

export type PdaScannerState =
  | 'IDLE'
  | 'WAITING_ORDER_SCAN'
  | 'ORDER_LOADED'
  | 'WAITING_TRAY_SCAN'
  | 'TRAY_VERIFIED'
  | 'WAITING_PRODUCT_SCAN'
  | 'PRODUCT_SCAN_SUCCESS'
  | 'PRODUCT_SCAN_ERROR'
  | 'TASK_DONE'
  | 'ORDER_COMPLETED'

export interface PDAPickingOrderResult extends ScanOrderResponse {
  tasks: PickingTask[]
}

export interface PDAPickingTaskView extends PickingTask {
  tray_code?: string
  product_code?: string
  product_name?: string
}

export interface PDAPickingOrderDetailResult extends OrderDetailResponse {}

export interface PDAVerifyTrayInput {
  taskId: number
  tray_qr_code: string
}

export interface PDAScanProductInput {
  taskId: number
  tray_qr_code: string
  product_qr_code: string
  note?: string
}

export interface PDATaskActionResult {
  message: string
  task: PickingTask
  remaining_quantity: number
}
