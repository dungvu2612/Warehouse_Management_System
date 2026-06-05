/*
- Mục đích: Types cho PDA Product Lookup.
- Phụ thuộc: endpoint GET /products/scan/:qr_code.
- Hợp đồng API: response product + inventory_total + trays.
- Warehouse business rules: lookup chỉ xem, khong can create/edit/delete.
- Ghi chú luồng scanner: scan product QR -> Enter -> fetch.
- Ghi chú bảo trì: dong bo voi product scan contract backend.
*/

import type { ProductScanResponse } from '../../products/types/productTypes'

export type PDAProductLookupResult = ProductScanResponse
