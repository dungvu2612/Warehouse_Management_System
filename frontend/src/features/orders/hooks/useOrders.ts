/*
- Mục đích: React Query hooks chỉ xem cho module Orders sau replacement refactor.
- Phụ thuộc: orderService.
- Hợp đồng API: Hien tai module nay chi query GET /orders va GET /orders/:id.
- Quy tắc nghiệp vụ: Orders module khong thao tac picking.
- Ghi chú refactor thay thế: hooks mutation picking/create/finish cu da bi xoa.
- Ghi chú bảo trì: Neu can mutation moi cho orders, them o module rieng va tranh tai tao flow picking o day.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderService } from '../services/orderService'
import type { OrderStatus } from '../types/orderTypes'

const ORDERS_QUERY_KEY = ['orders'] as const
const ORDER_DETAIL_QUERY_KEY = ['order-detail'] as const

export function useOrdersQuery(status?: OrderStatus) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, status || 'ALL'],
    queryFn: () => orderService.getOrders(status),
  })
}

export function useOrderByIdQuery(orderId: number | null) {
  return useQuery({
    queryKey: [...ORDER_DETAIL_QUERY_KEY, orderId],
    queryFn: () => orderService.getOrderById(orderId as number),
    enabled: typeof orderId === 'number' && orderId > 0,
  })
}

export function useUpdateOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: {
        customer_name: string
        customer_phone?: string
        customer_address?: string
        items: Array<{ product_id: number; quantity: number; unit_price: number }>
      }
    }) => orderService.updateOrder(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useDeleteOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderService.deleteOrder(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useAssignPickingOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, staffId }: { id: number; staffId: number }) => orderService.assignPickingOrder(id, staffId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_DETAIL_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['staff-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] }),
      ])
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useUnassignPickingOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderService.unassignPickingOrder(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_DETAIL_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['staff-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] }),
      ])
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}
