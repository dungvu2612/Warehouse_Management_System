import { http } from '../../../shared/lib/http'
import type { Product, ProductCodePreviewResponse, ProductPayload, ProductScanResponse, ProductType } from '../types/productTypes'

// Nhóm API thao tác với resource products.
export const productsApi = {
  getProducts: async (): Promise<Product[]> => {
    const { data } = await http.get<Product[]>('/products')
    return data
  },

  createProduct: async (payload: ProductPayload): Promise<Product> => {
    const { data } = await http.post<Product>('/products', payload)
    return data
  },

  updateProduct: async (id: number, payload: ProductPayload): Promise<Product> => {
    const { data } = await http.put<Product>(`/products/${id}`, payload)
    return data
  },

  getProductCodePreview: async (
    productType: ProductType,
    productName: string,
  ): Promise<ProductCodePreviewResponse> => {
    const { data } = await http.get<ProductCodePreviewResponse>('/products/code-preview', {
      params: {
        product_type: productType,
        product_name: productName,
      },
    })
    return data
  },

  deleteProduct: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/products/${id}`)
    return data
  },

  scanProductByQRCode: async (qrCode: string): Promise<ProductScanResponse> => {
    const { data } = await http.get<ProductScanResponse>(`/products/scan/${encodeURIComponent(qrCode)}`)
    return data
  },
}
