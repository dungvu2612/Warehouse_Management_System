/*
Senior Handover Note:
- Purpose: Types cho PDA Product Lookup.
- Dependencies: endpoint GET /products/scan/:qr_code.
- API contract: response product + inventory_total + trays.
- Warehouse business rules: lookup read-only, khong can create/edit/delete.
- Scanner workflow notes: scan product QR -> Enter -> fetch.
- Maintenance notes: dong bo voi product scan contract backend.
*/

import type { ProductScanResponse } from '../../products/types/productTypes'

export type PDAProductLookupResult = ProductScanResponse
