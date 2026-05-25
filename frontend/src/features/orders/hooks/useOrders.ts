/*
Mo ta file:
- React Query hooks cho module Orders/Picking.
- Hooks quan ly cache/loading/error/invalidate, khong chua nghiep vu UI.

Luong xu ly:
1) Query/Mutation goi service layer.
2) Sau mutation thanh cong, invalidate cac query key lien quan.
3) Page/components chi dung hooks de render va trigger action.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderService } from '../services/orderService'
import type {
  ConfirmPickingPayload,
  OrderCreatePayload,
  OrderStatus,
  ScanOrderPayload,
} from '../types/orderTypes'

const ORDERS_QUERY_KEY = ['orders'] as const
const ORDER_DETAIL_QUERY_KEY = ['order-detail'] as const
const ORDER_TASKS_QUERY_KEY = ['order-tasks'] as const
const ORDER_PROGRESS_QUERY_KEY = ['order-progress'] as const
const ORDER_BOM_OPTIONS_QUERY_KEY = ['order-bom-options'] as const

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

export function useOrderBOMOptionsQuery() {
  return useQuery({
    queryKey: ORDER_BOM_OPTIONS_QUERY_KEY,
    queryFn: () => orderService.getBOMOptions(),
  })
}

export function useOrderTasksQuery(orderId: number | null) {
  return useQuery({
    queryKey: [...ORDER_TASKS_QUERY_KEY, orderId],
    queryFn: () => orderService.getPickingTasks(orderId as number),
    enabled: typeof orderId === 'number' && orderId > 0,
  })
}

export function useOrderProgressQuery(orderId: number | null) {
  return useQuery({
    queryKey: [...ORDER_PROGRESS_QUERY_KEY, orderId],
    queryFn: () => orderService.getOrderProgress(orderId as number),
    enabled: typeof orderId === 'number' && orderId > 0,
  })
}

function invalidateOrderQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ORDER_DETAIL_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ORDER_TASKS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ORDER_PROGRESS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ORDER_BOM_OPTIONS_QUERY_KEY }),
  ])
}

export function useCreateOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: OrderCreatePayload) => orderService.createOrder(payload),
    onSuccess: async () => {
      await invalidateOrderQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useScanOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ScanOrderPayload) => orderService.scanOrderForPicking(payload),
    onSuccess: async () => {
      await invalidateOrderQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useConfirmPickingMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: ConfirmPickingPayload }) =>
      orderService.confirmPickingTask(taskId, payload),
    onSuccess: async () => {
      await invalidateOrderQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}

export function useFinishOrderMutation(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => orderService.finishOrder(orderId),
    onSuccess: async () => {
      await invalidateOrderQueries(queryClient)
      options?.onSuccess?.()
    },
    onError: (error) => options?.onError?.(error),
  })
}
