/*
- Mục đích: API layer cho PDA Stocktaking mode.
- Phụ thuộc: shared http client.
- Hợp đồng API: GET /trays/scan/:qr_code, POST /inventory/stocktaking.
- Warehouse business rules: stocktaking workflow scan tray -> compare -> confirm adjustment.
- Ghi chú luồng scanner: Enter submit cho scan va confirm.
- Ghi chú bảo trì: endpoint scan tray duoc dung de auto fill system qty.
*/

import { http } from '../../../shared/lib/http'
import type { PDAStocktakingPayload, PDAStocktakingResponse, TrayScanResponse } from '../types/pdaStocktakingTypes'

export const pdaStocktakingApi = {
  // stocktaking workflow: scan tray to load current system quantity
  scanTray: async (qrCode: string): Promise<TrayScanResponse> => {
    const { data } = await http.get<TrayScanResponse>(`/trays/scan/${encodeURIComponent(qrCode)}`)
    return data
  },

  // inventory atomic deduction/adjustment duoc xu ly backend transaction
  submitStocktaking: async (payload: PDAStocktakingPayload): Promise<PDAStocktakingResponse> => {
    const { data } = await http.post<PDAStocktakingResponse>('/inventory/stocktaking', payload)
    return data
  },
}
