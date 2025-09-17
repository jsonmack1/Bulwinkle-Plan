// Email Service Factory
// Centralizes email provider configuration

import { SendGridEmailProvider } from './providers/sendgrid'
import { AWSSESEmailProvider } from './providers/aws-ses'

interface EmailServiceConfig {
  provider: 'sendgrid' | 'aws-ses' | 'development'
  sendgrid?: {
    apiKey: string
    fromEmail: string
    fromName?: string
  }
  awsSes?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    fromEmail: string
    fromName?: string
  }
}

interface PasswordResetEmailData {
  to: string
  resetUrl: string
  userName: string
}

// Development email provider (logs to console)
class DevelopmentEmailProvider {
  async sendPasswordResetEmail({ to, resetUrl, userName }: PasswordResetEmailData): Promise<void> {
    console.log('\n🔐 ==================== PASSWORD RESET EMAIL ====================')
    console.log('📧 To:', to)
    console.log('👤 User:', userName)
    console.log('🔗 Reset URL:', resetUrl)
    console.log('⏰ Expires:', new Date(Date.now() + 60 * 60 * 1000).toISOString())
    console.log('💡 Development Mode: Copy the URL above to test password reset')
    console.log('===============================================================\n')
  }
}

export class EmailService {
  private provider: SendGridEmailProvider | AWSSESEmailProvider | DevelopmentEmailProvider

  constructor(config: EmailServiceConfig) {
    switch (config.provider) {
      case 'sendgrid':
        if (!config.sendgrid) {
          throw new Error('SendGrid configuration is required when using sendgrid provider')
        }
        this.provider = new SendGridEmailProvider(config.sendgrid)
        break
        
      case 'aws-ses':
        if (!config.awsSes) {
          throw new Error('AWS SES configuration is required when using aws-ses provider')
        }
        this.provider = new AWSSESEmailProvider(config.awsSes)
        break
        
      case 'development':
      default:
        this.provider = new DevelopmentEmailProvider()
        break
    }
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    return this.provider.sendPasswordResetEmail(data)
  }
}

// Factory function to create email service based on environment
export function createEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER as 'sendgrid' | 'aws-ses' | 'development' || 'development'

  const config: EmailServiceConfig = {
    provider,
    sendgrid: provider === 'sendgrid' ? {
      apiKey: process.env.SENDGRID_API_KEY!,
      fromEmail: process.env.EMAIL_FROM!,
      fromName: process.env.EMAIL_FROM_NAME || 'Peabody Lesson Builder'
    } : undefined,
    awsSes: provider === 'aws-ses' ? {
      region: process.env.AWS_REGION!,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      fromEmail: process.env.EMAIL_FROM!,
      fromName: process.env.EMAIL_FROM_NAME || 'Peabody Lesson Builder'
    } : undefined
  }

  return new EmailService(config)
}