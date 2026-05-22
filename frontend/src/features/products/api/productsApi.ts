import { http } from '../../../shared/lib/http'
import type { Product, ProductPayload } from '../types/productTypes'

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

  deleteProduct: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/products/${id}`)
    return data
  },
}
