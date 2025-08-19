import { User, LoginCredentials, SignupCredentials } from '../types/auth'

/**
 * Mock Authentication Service
 * In a real application, this would integrate with your backend/Supabase/Firebase
 */

const MOCK_USERS_KEY = 'lessonPlanBuilder_users'
const CURRENT_USER_KEY = 'lessonPlanBuilder_currentUser'

interface StoredUser extends User {
  password: string // Only stored locally in mock
}

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  private constructor() {
    // Initialize from localStorage
    this.loadCurrentUser()
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private loadCurrentUser(): void {
    // Only run on client side
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY)
      if (stored) {
        const user = JSON.parse(stored)
        // Remove password from user object for security
        const { password, ...userWithoutPassword } = user
        this.currentUser = userWithoutPassword
      }
    } catch (error) {
      console.warn('Failed to load current user:', error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CURRENT_USER_KEY)
      }
    }
  }

  private saveCurrentUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(CURRENT_USER_KEY)
      }
      this.currentUser = user
    } catch (error) {
      console.warn('Failed to save current user:', error)
    }
  }

  private getStoredUsers(): StoredUser[] {
    try {
      const stored = localStorage.getItem(MOCK_USERS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load users:', error)
      return []
    }
  }

  private saveStoredUsers(users: StoredUser[]): void {
    try {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
    } catch (error) {
      console.warn('Failed to save users:', error)
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    // Removed artificial delay for better performance

    const users = this.getStoredUsers()
    const user = users.find(u => 
      u.email.toLowerCase() === credentials.email.toLowerCase() && 
      u.password === credentials.password
    )

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user
    const authenticatedUser = userWithoutPassword as User

    // Sync subscription status with mock subscription system
    if (typeof window !== 'undefined') {
      const subscriptionStatus = authenticatedUser.subscription?.plan === 'premium' ? 'premium' : 'free'
      localStorage.setItem('mockSubscription', subscriptionStatus)
      window.dispatchEvent(new Event('subscription-changed'))
    }

    this.saveCurrentUser(authenticatedUser)
    return authenticatedUser
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    // Removed artificial delay for better performance

    const users = this.getStoredUsers()
    
    // Check if user already exists
    const existingUser = users.find(u => 
      u.email.toLowerCase() === credentials.email.toLowerCase()
    )
    
    if (existingUser) {
      throw new Error('An account with this email already exists')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Please enter a valid email address')
    }

    // Validate password
    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Create new user
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email.toLowerCase(),
      name: credentials.name,
      password: credentials.password,
      createdAt: new Date().toISOString(),
      subscription: {
        plan: 'free',
        status: 'active'
      }
    }

    // Save to storage
    users.push(newUser)
    this.saveStoredUsers(users)

    // Remove password from user object and authenticate
    const { password, ...userWithoutPassword } = newUser
    const authenticatedUser = userWithoutPassword as User

    this.saveCurrentUser(authenticatedUser)
    return authenticatedUser
  }

  async logout(): Promise<void> {
    // Removed artificial delay for better performance
    
    this.saveCurrentUser(null)
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  // Development helper methods
  async createDemoAccount(): Promise<User> {
    const user = await this.signup({
      email: 'demo@lessonbuilder.com',
      password: 'demo123',
      name: 'Demo Teacher'
    })
    
    // Make demo account premium automatically
    this.upgradeToPremium(user.id)
    
    // Also set premium status in mock subscription system
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockSubscription', 'premium')
      window.dispatchEvent(new Event('subscription-changed'))
    }
    
    // Return updated user with premium status
    return {
      ...user,
      subscription: {
        plan: 'premium',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  }

  upgradeToPremium(userId: string): void {
    const users = this.getStoredUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex >= 0) {
      users[userIndex].subscription = {
        plan: 'premium',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      this.saveStoredUsers(users)
      
      // Update current user if it's the same user
      if (this.currentUser?.id === userId) {
        this.currentUser.subscription = users[userIndex].subscription
        this.saveCurrentUser(this.currentUser)
      }
    }
  }

  // Reset for development
  clearAllData(): void {
    localStorage.removeItem(MOCK_USERS_KEY)
    localStorage.removeItem(CURRENT_USER_KEY)
    this.currentUser = null
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()