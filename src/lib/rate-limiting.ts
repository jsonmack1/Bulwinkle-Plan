// Rate Limiting System for Password Reset
// Prevents abuse and brute force attacks

interface RateLimitRule {
  key: string
  limit: number
  windowMs: number
}

interface RateLimitAttempt {
  count: number
  resetTime: number
}

class InMemoryRateLimiter {
  private attempts: Map<string, RateLimitAttempt> = new Map()

  async checkRateLimit(rule: RateLimitRule): Promise<{ success: boolean; remainingAttempts: number; resetTime: number }> {
    const now = Date.now()
    const { key, limit, windowMs } = rule
    
    let attempt = this.attempts.get(key)
    
    // Clean up expired entries
    if (attempt && now > attempt.resetTime) {
      this.attempts.delete(key)
      attempt = undefined
    }
    
    // Initialize or increment attempts
    if (!attempt) {
      attempt = {
        count: 1,
        resetTime: now + windowMs
      }
      this.attempts.set(key, attempt)
    } else {
      attempt.count++
    }
    
    const success = attempt.count <= limit
    const remainingAttempts = Math.max(0, limit - attempt.count)
    
    return {
      success,
      remainingAttempts,
      resetTime: attempt.resetTime
    }
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, attempt] of this.attempts.entries()) {
      if (now > attempt.resetTime) {
        this.attempts.delete(key)
      }
    }
  }
}

// Singleton rate limiter instance
const rateLimiter = new InMemoryRateLimiter()

// Clean up expired entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup()
}, 5 * 60 * 1000)

export interface PasswordResetRateLimitConfig {
  requestsPerEmail: number
  requestsPerIP: number
  windowMinutes: number
}

export class PasswordResetRateLimiter {
  private config: PasswordResetRateLimitConfig

  constructor(config: PasswordResetRateLimitConfig) {
    this.config = config
  }

  async checkEmailRateLimit(email: string): Promise<{ 
    success: boolean
    remainingAttempts: number
    resetTime: number
  }> {
    return rateLimiter.checkRateLimit({
      key: `email:${email.toLowerCase()}`,
      limit: this.config.requestsPerEmail,
      windowMs: this.config.windowMinutes * 60 * 1000
    })
  }

  async checkIPRateLimit(ip: string): Promise<{ 
    success: boolean
    remainingAttempts: number
    resetTime: number
  }> {
    return rateLimiter.checkRateLimit({
      key: `ip:${ip}`,
      limit: this.config.requestsPerIP,
      windowMs: this.config.windowMinutes * 60 * 1000
    })
  }
}

// Factory function to create rate limiter with environment config
export function createPasswordResetRateLimiter(): PasswordResetRateLimiter {
  const config: PasswordResetRateLimitConfig = {
    requestsPerEmail: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_REQUESTS_PER_EMAIL || '3'),
    requestsPerIP: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_REQUESTS_PER_IP || '10'),
    windowMinutes: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MINUTES || '60')
  }

  return new PasswordResetRateLimiter(config)
}

// Advanced rate limiting with Redis (for production with multiple servers)
export class RedisRateLimiter {
  // Implementation would use Redis for distributed rate limiting
  // This is useful when you have multiple server instances
  
  constructor(private redisClient: any) {}
  
  async checkRateLimit(rule: RateLimitRule): Promise<{ success: boolean; remainingAttempts: number; resetTime: number }> {
    // Redis implementation for production environments
    // Use Redis commands like INCR, EXPIRE for atomic operations
    throw new Error('Redis rate limiter not implemented yet')
  }
}