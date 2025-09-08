# Database Setup & Account Creation Fix Instructions

## Overview
This document outlines the steps needed to fix the account creation issue where subscription users aren't being populated in the Supabase database.

## Files Created/Modified
1. `database/cleanup_and_restructure.sql` - Database cleanup and setup script
2. `src/app/api/stripe/create-checkout/route.ts` - Fixed to create Supabase users
3. `src/app/api/stripe/webhook/route.ts` - Fixed to handle missing users

---

## Step 1: Run Database Cleanup (REQUIRED)

### In Supabase Dashboard:

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **IMPORTANT: Backup your data first!**
   ```sql
   -- Run this to export your current users (if any)
   SELECT * FROM users;
   SELECT * FROM lessons WHERE user_id IS NOT NULL;
   ```
4. **Run the cleanup script:**
   - Copy and paste the entire contents of `database/cleanup_and_restructure.sql`
   - Execute the script
   - This will:
     - Remove redundant tables (`discount_codes`, `stripe_products`, etc.)
     - Clean up and optimize the remaining tables
     - Add utility functions for user management
     - Set proper Row Level Security policies

### Verify Database Structure:
After running the script, you should have these core tables:
- `users` - Core user accounts with subscription info
- `usage_tracking` - Usage tracking with anonymous support  
- `lessons` - Generated lesson plans
- `payment_attempts` - Payment tracking
- `stripe_webhook_events` - Webhook audit log
- `analytics_events` - User behavior tracking
- `promo_codes` & `promo_code_uses` - Promotional codes (kept)
- `newsletter_signups` - Email signups (kept)

---

## Step 2: Update Environment Variables

### Required Environment Variables:
Make sure you have these set in your `.env.local` or deployment environment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For server-side operations

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

---

## Step 3: Configure Stripe Webhooks

### In Stripe Dashboard:

1. **Go to Developers → Webhooks**
2. **Add endpoint** with your webhook URL:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted` 
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `checkout.session.completed`

3. **Copy the webhook secret** and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Test the Fix

### Test Account Creation via Subscription:

1. **Create a test subscription:**
   - Go through your checkout flow
   - Use Stripe's test card: `4242 4242 4242 4242`
   - Complete the subscription

2. **Verify in Supabase:**
   ```sql
   -- Check if user was created
   SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
   
   -- Check subscription data
   SELECT email, subscription_status, current_plan, stripe_customer_id 
   FROM users 
   WHERE subscription_status = 'premium';
   ```

3. **Check webhook logs:**
   - Monitor your application logs
   - Look for successful webhook processing messages
   - Check the `stripe_webhook_events` table for audit trail

### Test Anonymous User Flow:

1. **Test checkout without login:**
   - Try subscribing with just an email (no account)
   - User should be automatically created in Supabase

2. **Verify webhook handles missing users:**
   - Manually create a Stripe subscription for a non-existent user
   - Webhook should create the user automatically

---

## Step 5: Monitor and Verify

### In Supabase Dashboard:

1. **Check the Auth section:**
   - You may want to eventually migrate from mock auth to Supabase Auth
   - For now, the system creates users directly in the `users` table

2. **Monitor the `users` table:**
   ```sql
   -- Users created in last 24 hours
   SELECT email, created_at, subscription_status, stripe_customer_id
   FROM users 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

3. **Check webhook processing:**
   ```sql
   -- Recent webhook events
   SELECT event_type, processed_status, received_at, error_message
   FROM stripe_webhook_events
   ORDER BY received_at DESC
   LIMIT 20;
   ```

---

## Step 6: Production Considerations

### Security:
- The database cleanup script sets proper RLS (Row Level Security) policies
- Anonymous users can only insert data, not read other users' data
- Authenticated users can only access their own data

### Performance:
- All necessary indexes have been created
- Redundant tables have been removed to improve performance

### Monitoring:
- Monitor webhook processing in the `stripe_webhook_events` table
- Set up alerts for failed webhook processing
- Monitor user creation rates in the `users` table

---

## Troubleshooting

### If Users Still Aren't Being Created:

1. **Check environment variables:**
   ```bash
   # In your app, log these values (remove in production)
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log('Has Stripe Secret:', !!process.env.STRIPE_SECRET_KEY)
   ```

2. **Check webhook signature:**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard
   - Check webhook logs for signature verification errors

3. **Check database permissions:**
   ```sql
   -- Test the utility function
   SELECT * FROM create_user_by_email('test@example.com', 'Test User', 'cus_test123');
   ```

4. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for database errors or permission issues

### Common Issues:

- **"Function create_user_by_email does not exist"**: Run the database cleanup script again
- **"Permission denied"**: Check RLS policies and database permissions  
- **"Webhook signature verification failed"**: Check `STRIPE_WEBHOOK_SECRET` environment variable
- **"User already exists"**: This is normal - the system handles duplicates gracefully

---

## Next Steps (Optional)

### Future Improvements:
1. **Migrate to Supabase Auth:**
   - Replace the mock authentication system
   - Use Supabase's built-in user management

2. **Add email verification:**
   - Implement email verification for new accounts
   - Add email confirmation flow

3. **Enhanced analytics:**
   - Use the cleaned-up analytics tables for better insights
   - Add conversion funnel tracking

---

## Summary

After following these steps:
1. ✅ Database will be cleaned up and optimized
2. ✅ Users who subscribe will be automatically created in Supabase
3. ✅ Webhooks will handle missing users gracefully
4. ✅ Anonymous users will be properly tracked
5. ✅ System will be more reliable and performant

The key fix is ensuring that whenever someone subscribes via Stripe, they get created in the Supabase `users` table so the webhook can find and update them properly.