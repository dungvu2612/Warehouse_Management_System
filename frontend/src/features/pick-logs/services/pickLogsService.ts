/*
Senior Handover Note:
- Purpose: Service layer cua Pick Logs, map/enrich/filter du lieu audit de component co the render gon.
- Dependencies: Goi `pickLogsApi`, nhan context tu Order Detail (order, tasks, trays) de map code/ten hien thi.
- Maintenance notes: Neu backend bo sung join fields, co the rut gon phan enrich tai day ma khong doi component.
- API contract: Lay du lieu goc tu GET /pick-logs (flat list), enrich phia frontend.
- Audit usage: Tap trung cho truy vet thao tac picker theo order/product/tray/picked_by.
*/

import { pickLogsApi } from '../api/pickLogsApi'
import type {
  PickLog,
  PickLogDisplayItem,
  PickLogFilterValues,
} from '../types/pickLogTypes'

type MapPickLogsContext = {
  orderCode: string
  tasks: Array<{
    id: number
    product_id: number
    product_code: string
    product_name: string
    tray_id: number
    tray_code: string
    verified: boolean
  }>
  trays: Array<{ id: number; tray_code: string }>
}

export const pickLogsService = {
  getPickLogs: async (params?: {
    order_id?: number
    picked_by?: number
    date_from?: string
    date_to?: string
    limit?: number
  }): Promise<PickLog[]> => {
    return pickLogsApi.getPickLogs(params)
  },

  // Senior Handover: Map response block - enrich pick log tu order/tasks/trays de co order_code/product/tray/picker labels.
  mapPickLogsForDisplay: (
    logs: PickLog[],
    context: MapPickLogsContext,
  ): PickLogDisplayItem[] => {
    const taskMap = new Map(context.tasks.map((task) => [task.id, task]))
    const trayMap = new Map(context.trays.map((tray) => [tray.id, tray.tray_code]))

    return logs.map((log) => {
      const task = log.picking_task_id ? taskMap.get(log.picking_task_id) : undefined
      const trayCode = (log.tray_id ? trayMap.get(log.tray_id) : undefined) || task?.tray_code || '-'

      return {
        ...log,
        order_code: context.orderCode || `#${log.order_id || '-'}`,
        product_code: task?.product_code || (log.product_id ? `#${log.product_id}` : '-'),
        product_name: task?.product_name || '-',
        tray_code: trayCode,
        picked_by_label: log.picked_by ? `User #${log.picked_by}` : '-',
        picked_status: 'PICKED',
        verified: Boolean(task?.verified),
      }
    })
  },

  // Senior Handover: Filter/search logic block - filter nhanh theo product/tray/picker + keyword realtime tren frontend.
  filterPickLogs: (rows: PickLogDisplayItem[], filters: PickLogFilterValues): PickLogDisplayItem[] => {
    const keyword = filters.searchKeyword.trim().toLowerCase()

    return rows.filter((row) => {
      if (filters.product !== 'ALL' && row.product_code !== filters.product) return false
      if (filters.tray !== 'ALL' && row.tray_code !== filters.tray) return false
      if (filters.picker !== 'ALL' && row.picked_by_label !== filters.picker) return false

      if (!keyword) return true

      return (
        row.order_code.toLowerCase().includes(keyword) ||
        row.product_code.toLowerCase().includes(keyword) ||
        row.product_name.toLowerCase().includes(keyword) ||
        row.tray_code.toLowerCase().includes(keyword) ||
        row.picked_by_label.toLowerCase().includes(keyword) ||
        (row.note || '').toLowerCase().includes(keyword)
      )
    })
  },
}
