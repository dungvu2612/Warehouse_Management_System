import { createContext } from 'react'
import type { AuthUser, LoginResponse } from '../../shared/types/auth'

export interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  loginSuccess: (payload: LoginResponse) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
