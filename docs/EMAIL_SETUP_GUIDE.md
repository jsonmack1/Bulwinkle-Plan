# Email Service Setup Guide

This guide walks you through configuring email services for password recovery in your Lesson Plan Builder application.

## 📧 **Email Provider Options**

### 1. **SendGrid (Recommended for small to medium scale)**

**Pros:**
- Easy setup and integration
- Reliable delivery rates
- Good free tier (100 emails/day)
- Excellent documentation

**Setup Steps:**

1. **Create SendGrid Account**
   - Go to [sendgrid.com](https://sendgrid.com)
   - Sign up for a free account
   - Verify your email address

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Restricted Access"
   - Select "Mail Send" permissions
   - Copy the API key (save it securely!)

3. **Verify Sender Identity**
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email details
   - Verify the email address

4. **Install Dependencies**
   ```bash
   npm install @sendgrid/mail
   ```

5. **Environment Variables**
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Peabody Lesson Builder
   ```

### 2. **AWS SES (Recommended for large scale)**

**Pros:**
- Very cost-effective at scale
- High deliverability
- Integrates well with other AWS services
- No daily sending limits (after verification)

**Setup Steps:**

1. **AWS Account Setup**
   - Create AWS account at [aws.amazon.com](https://aws.amazon.com)
   - Navigate to SES (Simple Email Service)

2. **Verify Email/Domain**
   - In SES Console → Verified identities
   - Add your email address or domain
   - Complete verification process

3. **Request Production Access**
   - By default, SES is in "sandbox mode"
   - Submit a request to move to production
   - This allows sending to any email address

4. **Create IAM User**
   - Go to IAM → Users → Create User
   - Attach policy: `AmazonSESFullAccess`
   - Create access keys for this user

5. **Install Dependencies**
   ```bash
   npm install @aws-sdk/client-ses
   ```

6. **Environment Variables**
   ```env
   EMAIL_PROVIDER=aws-ses
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Peabody Lesson Builder
   ```

### 3. **Development Mode (Default)**

**For Testing:**
- No email is actually sent
- Reset URLs are logged to console
- Perfect for development and testing

**Environment Variables**
```env
EMAIL_PROVIDER=development
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Peabody Lesson Builder
```

## 🔧 **Configuration Steps**

### Step 1: Choose Your Provider

Based on your needs:
- **Starting out?** → Use **Development Mode**
- **Small to medium scale?** → Use **SendGrid**
- **Large scale/enterprise?** → Use **AWS SES**

### Step 2: Set Environment Variables

1. **Copy the example file:**
   ```bash
   cp env.example .env.local
   ```

2. **Update your `.env.local` file** with the appropriate variables for your chosen provider

3. **Set the app URL:**
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

### Step 3: Install Dependencies

Choose based on your provider:

```bash
# For SendGrid
npm install @sendgrid/mail

# For AWS SES  
npm install @aws-sdk/client-ses

# For development (no additional packages needed)
```

### Step 4: Test the Configuration

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Test password reset:**
   - Go to login page
   - Click "Forgot your password?"
   - Enter an email address
   - Check console (development) or email inbox (production)

## 🛡️ **Rate Limiting Configuration**

### Environment Variables

```env
# Allow 3 reset requests per email per hour
RATE_LIMIT_PASSWORD_RESET_REQUESTS_PER_EMAIL=3

# Allow 10 reset requests per IP per hour  
RATE_LIMIT_PASSWORD_RESET_REQUESTS_PER_IP=10

# Time window in minutes
RATE_LIMIT_PASSWORD_RESET_WINDOW_MINUTES=60
```

### Rate Limiting Rules

- **Per Email**: Prevents spamming a specific email address
- **Per IP**: Prevents abuse from a single IP address
- **Time Window**: How long the limit applies

### Customizing Rate Limits

Adjust based on your needs:
- **Stricter**: Lower numbers (e.g., 2 per email, 5 per IP)
- **More Lenient**: Higher numbers (e.g., 5 per email, 20 per IP)
- **Shorter Window**: 30 minutes instead of 60

## 📧 **Email Template Customization**

### Customize Email Content

Edit the email templates in:
- `src/lib/email/providers/sendgrid.ts`
- `src/lib/email/providers/aws-ses.ts`

### Email Template Features

Current templates include:
- **Responsive HTML design**
- **Security warnings**
- **Branded appearance**
- **Clear call-to-action buttons**
- **Plain text fallback**

### Template Variables

Available in templates:
- `resetUrl` - The password reset link
- `userName` - User's name
- `to` - User's email address

## 🔍 **Testing and Debugging**

### Development Testing

1. **Console Logs:**
   ```
   🔐 ==================== PASSWORD RESET EMAIL ====================
   📧 To: user@example.com
   👤 User: John Doe
   🔗 Reset URL: http://localhost:3000/reset-password?token=abc123...
   ⏰ Expires: 2024-01-01T13:00:00Z
   💡 Development Mode: Copy the URL above to test password reset
   ===============================================================
   ```

2. **Test Flow:**
   - Copy the reset URL from console
   - Paste into browser
   - Test password reset form

### Production Testing

1. **Use a test email address you control**
2. **Check spam folder** if email doesn't arrive
3. **Verify sender reputation** with your email provider
4. **Test with different email providers** (Gmail, Outlook, etc.)

### Common Issues

1. **Emails going to spam:**
   - Verify your domain with your email provider
   - Set up SPF, DKIM, and DMARC records
   - Use a verified sending domain

2. **Rate limiting triggering:**
   - Check the console logs for rate limit messages
   - Adjust rate limit settings if needed
   - Clear rate limit cache for testing

3. **API errors:**
   - Check API key validity
   - Verify permissions and settings
   - Check email provider status pages

## 🚀 **Production Deployment**

### Pre-deployment Checklist

- [ ] Email provider configured and tested
- [ ] Environment variables set correctly
- [ ] Domain verified with email provider
- [ ] Rate limiting configured appropriately
- [ ] Email templates customized with your branding
- [ ] Test emails sent to various email providers
- [ ] Monitoring and logging set up

### Monitoring

Track these metrics:
- **Email delivery rates**
- **Password reset completion rates**
- **Rate limiting hits**
- **Failed email attempts**

### Security Best Practices

- [ ] Use environment variables for secrets
- [ ] Rotate API keys regularly
- [ ] Monitor for abuse patterns
- [ ] Set up alerting for unusual activity
- [ ] Keep email provider credentials secure

## 💡 **Advanced Configuration**

### Multiple Email Providers

For high availability, you could implement fallback providers:

```typescript
// Example fallback logic
try {
  await sendgridProvider.sendEmail(data)
} catch (error) {
  console.warn('SendGrid failed, trying AWS SES...')
  await awsSesProvider.sendEmail(data)
}
```

### Email Analytics

Track email performance:
- Open rates
- Click rates
- Delivery rates
- Bounce rates

### Custom Domains

For better deliverability:
- Set up a custom sending domain
- Configure DNS records
- Verify domain ownership

This completes your email service setup! Your password recovery system will now send professional emails to users when they request password resets.