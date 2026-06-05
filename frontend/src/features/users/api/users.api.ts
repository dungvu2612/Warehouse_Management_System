import { http } from '../../../shared/lib/http'
import type { User, UserCreatePayload, UserUpdatePayload } from '../types/user.types'

export const usersApi = {
  getUsers: async (params?: {
    search?: string
    role?: string
    is_active?: string
  }): Promise<User[]> => {
    const { data } = await http.get<User[]>('/users', { params })
    return data
  },

  createUser: async (payload: UserCreatePayload): Promise<User> => {
    const { data } = await http.post<User>('/users', payload)
    return data
  },

  getUserById: async (id: number): Promise<User> => {
    const { data } = await http.get<User>(`/users/${id}`)
    return data
  },

  updateUser: async (id: number, payload: UserUpdatePayload): Promise<User> => {
    const { data } = await http.put<User>(`/users/${id}`, payload)
    return data
  },

  updateStatus: async (id: number, isActive: boolean): Promise<User> => {
    const { data } = await http.patch<User>(`/users/${id}/status`, { is_active: isActive })
    return data
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    const { data } = await http.delete<{ message: string }>(`/users/${id}`)
    return data
  },
}
