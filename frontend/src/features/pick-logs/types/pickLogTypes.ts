/*
Senior Handover Note:
- Purpose: Dinh nghia contracts TypeScript cho module Pick Logs va read-model phuc vu audit trong frontend.
- Dependencies: Dung boi api/service/hooks/components cua `features/pick-logs` va nhung vao Order Detail.
- Maintenance notes: Khi backend doi field pick log hoac doi shape response, cap nhat type tai day truoc de trigger compile warning.
- API contract: GET /pick-logs (query: order_id, picked_by, date_from, date_to, limit) tra danh sach phang.
- Audit usage: Loai type nay danh cho truy vet thao tac picking, khong dung cho create/edit/delete.
*/

export interface PickLog {
  id: number
  picking_task_id: number | null
  order_id: number | null
  product_id: number | null
  tray_id: number | null
  picked_quantity: number
  picked_by: number | null
  picked_at: string
  note: string
}

// Senior Handover: PickLogItem de du phong neu backend doi sang nested response trong tuong lai.
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
