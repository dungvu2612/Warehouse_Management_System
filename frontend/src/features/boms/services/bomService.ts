/*
Mo ta file:
- Service ứng dụng layer cua module BOM.
- Day la noi chua nghiep vu FE: loc product options theo product_type, loc danh sach BOM theo keyword.

Luong xu ly:
1) Hooks goi service thay vi goi API truc tiep.
2) Service goi API layer de lay du lieu tho.
3) Service thuc hien normalize/filter va tra ket qua typed cho hooks/trang.

Luu y khi sua:
- Moi rule nghiep vu FE cua BOM nen dua vao day de hooks gon.
- Khong de UI dependencies (MUI/React state) trong service.
*/

import { bomsApi } from '../api/bomsApi'
import type {
  BOM,
  BOMItemsResponse,
  BOMPayload,
  ProductOption,
  ProductType,
} from '../types/bomTypes'

// Service cho module BOM.
export const bomService = {
  // Lay danh sach BOM tho tu backend.
  getBOMs: async (productId?: number): Promise<BOM[]> => {
    return bomsApi.getBOMs(productId)
  },

  // Lay chi tiet items theo BOM id.
  getBOMItems: async (bomId: number): Promise<BOMItemsResponse> => {
    return bomsApi.getBOMItems(bomId)
  },

  // Tao BOM moi.
  createBOM: async (payload: BOMPayload): Promise<BOM> => {
    return bomsApi.createBOM(payload)
  },

  // Cap nhat BOM.
  updateBOM: async (id: number, payload: BOMPayload): Promise<BOM> => {
    return bomsApi.updateBOM(id, payload)
  },

  // Xoa BOM.
  deleteBOM: async (id: number): Promise<{ message: string }> => {
    return bomsApi.deleteBOM(id)
  },

  // Lay product options theo type tu danh sach products tong.
  getProductsByType: async (productType: ProductType): Promise<ProductOption[]> => {
    const products = await bomsApi.getProducts()
    return products.filter(
      (product) => product.product_type === productType && product.is_active,
    )
  },

  // Loc list BOM theo keyword phuc vu UX search.
  filterBOMsByKeyword: (boms: BOM[], keywordRaw: string): BOM[] => {
    const keyword = keywordRaw.trim().toLowerCase()
    if (!keyword) return boms

    return boms.filter((bom) => {
      const parentCode = bom.product?.product_code?.toLowerCase() || ''
      const parentName = bom.product?.product_name?.toLowerCase() || ''
      const creatorName = bom.creator?.full_name?.toLowerCase() || ''
      const creatorUsername = bom.creator?.username?.toLowerCase() || ''
      const bomName = bom.bom_name?.toLowerCase() || ''
      const description = bom.description?.toLowerCase() || ''

      return (
        parentCode.includes(keyword) ||
        parentName.includes(keyword) ||
        creatorName.includes(keyword) ||
        creatorUsername.includes(keyword) ||
        bomName.includes(keyword) ||
        description.includes(keyword)
      )
    })
  },
}
