/*
- Mục đích: API layer cho PDA Putaway mode.
- Phụ thuộc: shared http client.
- Hợp đồng API: POST /inventory/putaway.
- Warehouse business rules: import transaction audit duoc backend ghi atomically.
- Ghi chú luồng scanner: chuỗi input keyboard wedge cho product/tray/qty.
- Ghi chú bảo trì: giu payload ngan, khong gui JSON nested phuc tap.
*/

import { http } from '../../../shared/lib/http'
import type { PDAPutawayPayload, PDAPutawayResponse } from '../types/pdaPutawayTypes'

export const pdaPutawayApi = {
  // stock transaction audit: backend tu dong ghi IMPORT khi putaway thanh cong
  putaway: async (payload: PDAPutawayPayload): Promise<PDAPutawayResponse> => {
    const { data } = await http.post<PDAPutawayResponse>('/inventory/putaway', payload)
    return data
  },
}
