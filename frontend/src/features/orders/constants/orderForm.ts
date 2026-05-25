/*
Mo ta file:
- Chua gia tri mac dinh cho cac form trong module Orders.
- Tach constants de tranh hard-code trong page/components.

Luong xu ly:
1) Page import default payload tu day.
2) Sau khi mutation thanh cong, reset form ve default.
*/

import type { ConfirmPickingPayload, OrderCreatePayload, ScanOrderPayload } from '../types/orderTypes'

export const defaultOrderCreateForm: OrderCreatePayload = {
  bom_id: 0,
  machine_qty: 1,
  customer_name: '',
}

export const defaultScanOrderForm: ScanOrderPayload = {
  order_code: '',
}

export const defaultConfirmPickingForm: ConfirmPickingPayload = {
  tray_code: '',
  quantity: 1,
  note: '',
}
