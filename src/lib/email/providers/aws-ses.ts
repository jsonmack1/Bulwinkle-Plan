// AWS SES Email Provider
// npm install @aws-sdk/client-ses

// Dynamic imports to avoid build errors when package isn't installed
let SESClient: any
let SendEmailCommand: any

interface AWSSESConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
  fromEmail: string
  fromName?: string
}

interface PasswordResetEmailData {
  to: string
  resetUrl: string
  userName: string
}

export class AWSSESEmailProvider {
  private client: any
  private config: AWSSESConfig

  constructor(config: AWSSESConfig) {
    this.config = config
  }

  private async initializeAWSSES() {
    if (!SESClient) {
      try {
        const aws = await import('@aws-sdk/client-ses')
        SESClient = aws.SESClient
        SendEmailCommand = aws.SendEmailCommand
        
        this.client = new SESClient({
          region: this.config.region,
          credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          },
        })
      } catch (error) {
        throw new Error('AWS SDK package not installed. Run: npm install @aws-sdk/client-ses')
      }
    }
  }

  async sendPasswordResetEmail({ to, resetUrl, userName }: PasswordResetEmailData): Promise<void> {
    await this.initializeAWSSES()
    
    const fromAddress = this.config.fromName 
      ? `${this.config.fromName} <${this.config.fromEmail}>`
      : this.config.fromEmail

    const params = {
      Source: fromAddress,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: 'Reset Your Password - Peabody Lesson Builder',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: this.getPasswordResetTemplate({ resetUrl, userName }),
            Charset: 'UTF-8',
          },
          Text: {
            Data: this.getPasswordResetTextTemplate({ resetUrl, userName }),
            Charset: 'UTF-8',
          },
        },
      },
    }

    try {
      const command = new SendEmailCommand(params)
      const result = await this.client.send(command)
      console.log('✅ Password reset email sent via AWS SES to:', to, 'MessageId:', result.MessageId)
    } catch (error) {
      console.error('❌ AWS SES email failed:', error)
      throw new Error('Failed to send password reset email')
    }
  }

  private getPasswordResetTemplate({ resetUrl, userName }: { resetUrl: string, userName: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 150px; height: auto; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
        .button { 
            display: inline-block; 
            background: #3B82F6; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://your-domain.com/peabody-logo.svg" alt="Peabody" class="logo">
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
            <p>Hello ${userName},</p>
            
            <p>We received a request to reset your password for your Peabody Lesson Builder account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>You can only use this link once</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3B82F6;">${resetUrl}</p>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The Peabody Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${to}. If you have questions, contact support.</p>
            <p>&copy; 2024 Peabody Lesson Builder. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private getPasswordResetTextTemplate({ resetUrl, userName }: { resetUrl: string, userName: string }): string {
    return `
Hello ${userName},

We received a request to reset your password for your Peabody Lesson Builder account.

To reset your password, click this link:
${resetUrl}

SECURITY NOTICE:
- This link will expire in 1 hour
- You can only use this link once
- If you didn't request this reset, please ignore this email

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The Peabody Team

---
This email was sent to ${userName}. If you have questions, contact support.
© 2024 Peabody Lesson Builder. All rights reserved.
    `
  }
}