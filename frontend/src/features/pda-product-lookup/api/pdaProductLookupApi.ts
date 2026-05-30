/*
Senior Handover Note:
- Purpose: API layer cho PDA Product Lookup.
- Dependencies: shared http client.
- API contract: GET /products/scan/:qr_code.
- Warehouse business rules: product QR workflow de lookup vi tri ton kho, khong dung cho picking direct.
- Scanner workflow notes: HT730 scan -> Enter -> call endpoint.
- Maintenance notes: Neu backend bo sung field trays, map typed contract tai file type.
*/

import { http } from '../../../shared/lib/http'
import type { PDAProductLookupResult } from '../types/pdaProductLookupTypes'

export const pdaProductLookupApi = {
  // product QR workflow: scan product qr to load product + inventory + trays
  scanProduct: async (qrCode: string): Promise<PDAProductLookupResult> => {
    const { data } = await http.get<PDAProductLookupResult>(`/products/scan/${encodeURIComponent(qrCode)}`)
    return data
  },
}
