export type UserRole = 'ADMIN' | 'WAREHOUSE'

export interface User {
  id: number
  username: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserCreatePayload {
  username: string
  password: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export interface UserUpdatePayload {
  full_name: string
  role: UserRole
  is_active: boolean
  password?: string
}
