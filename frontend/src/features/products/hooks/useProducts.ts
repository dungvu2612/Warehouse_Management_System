/*
Mo ta file:
- React Query hooks cho module Products.
- Hooks chi giu nhiem vu data-state orchestration, khong chua business logic.

Luong xu ly:
1) Query/mutation goi qua productService.
2) Sau mutation thanh cong, invalidate cache products.
3) Tra ket qua loading/error/data cho page/components.

Luu y khi sua:
- Neu them query key moi, can cap nhat invalidate dong bo.
- De nghiep vu filter/transform o service layer.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/productService'
import type { ProductPayload, ProductType } from '../types/productTypes'

// Query key trung tam cua products module.
const PRODUCTS_QUERY_KEY = ['products'] as const
const PRODUCT_CODE_PREVIEW_QUERY_KEY = ['product-code-preview'] as const

// Hook lay danh sach products.
export function useProductsQuery() {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: productService.getProducts,
  })
}

// Hook preview product_code realtime tu backend.
export function useProductCodePreviewQuery(
  productType: ProductType,
  productName: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...PRODUCT_CODE_PREVIEW_QUERY_KEY, productType, productName],
    queryFn: () => productService.getProductCodePreview(productType, productName),
    enabled,
  })
}

// Hook tao product.
export function useCreateProductMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProductPayload) => productService.createProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

// Hook cap nhat product.
export function useUpdateProductMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductPayload }) =>
      productService.updateProduct(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

// Hook xoa mem product.
export function useDeleteProductMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}
