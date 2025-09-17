export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  subscription?: {
    plan: 'free' | 'premium' | 'enterprise'
    status: 'active' | 'cancelled' | 'expired'
    currentPeriodEnd?: string
  }
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  name: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  newPassword: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>
  confirmPasswordReset: (confirm: PasswordResetConfirm) => Promise<void>
  clearError: () => void
}