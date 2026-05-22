import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../api/productsApi'
import type { ProductPayload } from '../types/productTypes'

// Query key trung tâm của products module.
const PRODUCTS_QUERY_KEY = ['products'] as const

// Hook lấy danh sách products.
export function useProductsQuery() {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: productsApi.getProducts,
  })
}

// Hook tạo product.
export function useCreateProductMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProductPayload) => productsApi.createProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

// Hook cập nhật product.
export function useUpdateProductMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductPayload }) =>
      productsApi.updateProduct(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

// Hook xóa mềm product.
export function useDeleteProductMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => productsApi.deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}
