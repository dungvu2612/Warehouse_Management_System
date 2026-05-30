/*
Senior Handover Note:
- Purpose: API layer cho PDA Putaway mode.
- Dependencies: shared http client.
- API contract: POST /inventory/putaway.
- Warehouse business rules: import transaction audit duoc backend ghi atomically.
- Scanner workflow notes: keyboard wedge input chaining product/tray/qty.
- Maintenance notes: giu payload ngan, khong gui JSON nested phuc tap.
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
