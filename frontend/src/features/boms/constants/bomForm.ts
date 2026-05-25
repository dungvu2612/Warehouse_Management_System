/*
Mo ta file:
- Khai bao default form state cho module BOM.
- Gom gia tri mac dinh giup UI reset form nhat quan sau create/switch mode.

Luong xu ly:
1) Page import default state tu day.
2) Dialog su dung default de khoi tao/reset.
3) Tranh hard-code gia tri lap lai nhieu noi.
*/

import type { BOMPayload } from '../types/bomTypes'

// Gia tri mac dinh form tao/cap nhat BOM.
export const defaultBOMForm: BOMPayload = {
  product_id: 0,
  bom_name: '',
  description: '',
  items: [
    {
      component_product_id: 0,
      quantity: 1,
    },
  ],
}
