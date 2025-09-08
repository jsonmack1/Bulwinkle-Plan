import { User, LoginCredentials, SignupCredentials } from '../types/auth'
import { supabase } from './supabase'

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
    // First, check localStorage users (existing functionality)
    const users = this.getStoredUsers()
    const localUser = users.find(u => 
      u.email.toLowerCase() === credentials.email.toLowerCase() && 
      u.password === credentials.password
    )

    if (localUser) {
      // Remove password from user object
      const { password, ...userWithoutPassword } = localUser
      const authenticatedUser = userWithoutPassword as User

      // Sync with Supabase user data if available
      try {
        const { data: supabaseUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email.toLowerCase())
          .single();

        if (supabaseUser) {
          // Merge localStorage user with Supabase subscription data
          authenticatedUser.subscription = {
            plan: supabaseUser.current_plan === 'free' ? 'free' : 'premium',
            status: supabaseUser.subscription_status === 'premium' ? 'active' : 'inactive',
            currentPeriodEnd: supabaseUser.subscription_end_date
          };
          
          // Update localStorage with Supabase UUID
          if (localUser.id !== supabaseUser.id) {
            const updatedUsers = this.getStoredUsers();
            const userIndex = updatedUsers.findIndex(u => u.email === credentials.email.toLowerCase());
            if (userIndex >= 0) {
              updatedUsers[userIndex].id = supabaseUser.id;
              this.saveStoredUsers(updatedUsers);
              authenticatedUser.id = supabaseUser.id;
            }
          }
        }
      } catch (supabaseError) {
        console.warn('Failed to sync with Supabase user data:', supabaseError);
        // Continue with localStorage data
      }

      // Sync subscription status with mock subscription system
      if (typeof window !== 'undefined') {
        const subscriptionStatus = authenticatedUser.subscription?.plan === 'premium' ? 'premium' : 'free'
        localStorage.setItem('mockSubscription', subscriptionStatus)
        window.dispatchEvent(new Event('subscription-changed'))
      }

      this.saveCurrentUser(authenticatedUser)
      return authenticatedUser
    }

    // If not found in localStorage, check Supabase directly
    try {
      const { data: supabaseUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .single();

      if (supabaseUser) {
        // Create a user object compatible with the current system
        const authenticatedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.name,
          createdAt: supabaseUser.created_at,
          subscription: {
            plan: supabaseUser.current_plan === 'free' ? 'free' : 'premium',
            status: supabaseUser.subscription_status === 'premium' ? 'active' : 'inactive',
            currentPeriodEnd: supabaseUser.subscription_end_date
          }
        };

        // Save to localStorage for offline access
        const localUserWithPassword: StoredUser = {
          ...authenticatedUser,
          password: credentials.password // Store password locally (not ideal, but maintains compatibility)
        };
        
        const updatedUsers = this.getStoredUsers();
        updatedUsers.push(localUserWithPassword);
        this.saveStoredUsers(updatedUsers);

        // Sync subscription status
        if (typeof window !== 'undefined') {
          const subscriptionStatus = authenticatedUser.subscription?.plan === 'premium' ? 'premium' : 'free'
          localStorage.setItem('mockSubscription', subscriptionStatus)
          window.dispatchEvent(new Event('subscription-changed'))
        }

        this.saveCurrentUser(authenticatedUser)
        return authenticatedUser
      }
    } catch (supabaseError) {
      console.warn('Failed to login with Supabase:', supabaseError);
    }

    throw new Error('Invalid email or password')
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

    // Save to localStorage
    users.push(newUser)
    this.saveStoredUsers(users)

    // ALSO save to Supabase database
    try {
      const { data: createdUserId, error } = await supabase
        .rpc('create_user_by_email', {
          p_email: credentials.email.toLowerCase(),
          p_name: credentials.name,
          p_stripe_customer_id: null
        });
      
      if (!error && createdUserId) {
        console.log('✅ Created user in Supabase:', createdUserId);
        // Update the localStorage user with the Supabase UUID
        const updatedUsers = this.getStoredUsers();
        const userIndex = updatedUsers.findIndex(u => u.email === credentials.email.toLowerCase());
        if (userIndex >= 0) {
          updatedUsers[userIndex].id = createdUserId; // Use Supabase UUID
          this.saveStoredUsers(updatedUsers);
          newUser.id = createdUserId; // Update local reference
        }
      } else {
        console.warn('Failed to create user in Supabase:', error);
        // Continue with localStorage-only user (fallback)
      }
    } catch (supabaseError) {
      console.warn('Supabase user creation failed:', supabaseError);
      // Continue with localStorage-only user (fallback)
    }

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