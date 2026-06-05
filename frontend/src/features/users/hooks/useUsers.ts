import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users.api'
import type { UserCreatePayload, UserUpdatePayload } from '../types/user.types'

const USERS_QUERY_KEY = ['users'] as const

export function useUsersQuery(params?: { search?: string; role?: string; is_active?: string }) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, params?.search || '', params?.role || '', params?.is_active || ''],
    queryFn: () => usersApi.getUsers(params),
  })
}

export function useUserByIdQuery(userId: number | null) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, 'detail', userId || 0],
    queryFn: () => usersApi.getUserById(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserCreatePayload) => usersApi.createUser(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdatePayload }) => usersApi.updateUser(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => usersApi.updateStatus(id, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}
