/*
Mo ta file:
- Service ứng dụng layer cua module Products.
- Tap trung nghiep vu FE cua products: filter/search theo type+keyword va goi API layer.

Luong xu ly:
1) Hooks goi service thay vi goi API truc tiep.
2) Service goi API de lay/ghi du lieu.
3) Service cung cap helper nghiep vu de trang reuse, tranh lap logic.

Luu y khi sua:
- Khong dat React/UI state vao service.
- Moi nghiep vu dung chung nen dua vao day de de test.
*/

import { productsApi } from '../api/productsApi'
import type {
  Product,
  ProductCodePreviewResponse,
  ProductPayload,
  ProductType,
} from '../types/productTypes'

// Service module products.
export const productService = {
  // Lay danh sach products active.
  getProducts: async (): Promise<Product[]> => {
    return productsApi.getProducts()
  },

  // Tao product moi.
  createProduct: async (payload: ProductPayload): Promise<Product> => {
    return productsApi.createProduct(payload)
  },

  // Cap nhat product.
  updateProduct: async (id: number, payload: ProductPayload): Promise<Product> => {
    return productsApi.updateProduct(id, payload)
  },

  // Lay preview product_code tu backend theo product_type + product_name.
  getProductCodePreview: async (
    productType: ProductType,
    productName: string,
  ): Promise<ProductCodePreviewResponse> => {
    return productsApi.getProductCodePreview(productType, productName)
  },

  // Xoa mem product.
  deleteProduct: async (id: number): Promise<{ message: string }> => {
    return productsApi.deleteProduct(id)
  },

  // Loc products theo product_type + keyword phuc vu search UX.
  filterProductsByTypeAndKeyword: (
    products: Product[],
    type: ProductType,
    keywordRaw: string,
  ): Product[] => {
    const keyword = keywordRaw.trim().toLowerCase()

    // Loc theo type truoc.
    const typeFiltered = products.filter((product) => product.product_type === type)

    // Khong co keyword thi tra luon.
    if (!keyword) return typeFiltered

    // Co keyword thi loc tiep theo ma/ten/don vi.
    return typeFiltered.filter(
      (product) =>
        product.product_code.toLowerCase().includes(keyword) ||
        product.product_name.toLowerCase().includes(keyword) ||
        product.unit.toLowerCase().includes(keyword),
    )
  },
}
