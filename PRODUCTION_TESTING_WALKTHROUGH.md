# Production Testing Walkthrough 🚀

## Prerequisites Check

Before we start, let's verify you have everything needed:

### 1. Environment Variables
Check your production `.env` file has:
```bash
STRIPE_SECRET_KEY=sk_live_... # Your LIVE Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_live_... # Your LIVE Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook endpoint secret
```

### 2. Stripe Price IDs
You'll need your actual Stripe price IDs. Find them in:
- Stripe Dashboard → Products → [Your Product] → Pricing
- Copy the price IDs (format: `price_xxxxxxxxxxxxx`)

---

## Step 1: Set Up Stripe Promotion Codes

### 1.1 Run the Setup Script
```bash
cd "C:\Users\jmack\Desktop\Lesson_Plan_Builder"

# Make sure you're using production Stripe keys
node setup-stripe-promo-codes.js
```

**Expected Output:**
```
🎟️ Setting up Stripe Promotion Codes
=====================================

🎫 Creating campaign: PAPERCLIP
  📋 Creating coupon: paperclip-30days-free
  ✅ Created coupon: paperclip-30days-free
  🎟️ Creating promotion code: PAPERCLIP
  ✅ Created promotion code: PAPERCLIP
  📊 Summary:
     Code: PAPERCLIP
     Discount: 100% off
     Duration: once
     Max Redemptions: 1000
     Active: true
```

### 1.2 Verify in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Coupons**
3. You should see: `paperclip-30days-free`, `telescope-3months-free`, etc.
4. Navigate to **Products** → **Promotion codes**
5. You should see: `PAPERCLIP`, `TELESCOPE2025`, `MIDNIGHT50`

---

## Step 2: Update Your Pricing Page

### 2.1 Find Your Current Pricing Page
Look for files like:
- `src/app/pricing/page.tsx`
- `src/components/pricing/PricingPage.tsx`
- Or wherever you have pricing/upgrade buttons

### 2.2 Add the New Component
```tsx
// Add this import at the top
import { StripePromoCodeInput } from '../components/premium/StripePromoCodeInput';

// In your pricing component, add this where you want the promo input:
<StripePromoCodeInput
  priceId="price_YOUR_ACTUAL_MONTHLY_PRICE_ID" // Replace with real price ID
  billingPeriod="monthly"
  fingerprint={fingerprint} // If you have fingerprinting
  className="mt-4"
/>
```

### 2.3 Get Your Real Price IDs
1. Go to Stripe Dashboard → Products
2. Click on your subscription product
3. Copy the price IDs from the pricing section
4. Replace `"price_YOUR_ACTUAL_MONTHLY_PRICE_ID"` with the real ID

Example:
```tsx
<StripePromoCodeInput
  priceId="price_1NXqK2L7j8K9..." // Your actual monthly price
  billingPeriod="monthly"
  className="mt-4"
/>
```

---

## Step 3: Deploy to Production

### 3.1 Deploy Your Changes
```bash
# If using Vercel:
npm run build
vercel --prod

# If using other deployment:
# Follow your normal deployment process
```

### 3.2 Verify Deployment
1. Visit your production pricing page
2. Look for the "🎟️ Have a promo code?" link
3. Click it to expand the promo input

---

## Step 4: Test the Complete Flow

### 4.1 Test Invalid Promo Code First
1. Go to your production pricing page
2. Click "🎟️ Have a promo code?"
3. Enter "INVALIDCODE123"
4. Click "Apply Code"
5. **Expected**: Should show error message like "Promotion code 'INVALIDCODE123' is invalid or expired"

### 4.2 Test Valid Promo Code (PAPERCLIP)
1. Go to your production pricing page
2. Click "🎟️ Have a promo code?"
3. Enter "PAPERCLIP"
4. Click "Apply Code"
5. **Expected**: Should redirect to Stripe checkout

### 4.3 Complete Stripe Checkout
1. On Stripe checkout page, verify:
   - Shows your product name
   - Shows ~~$29.99~~ **$0.00** (or your price crossed out)
   - Says "30 days free" or similar
2. Enter test card info:
   - Email: your-email@example.com
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits
3. Click "Subscribe"

### 4.4 Verify Success
1. Should redirect back to your app
2. Check if header shows "💎 Premium" instead of "Free"
3. Try accessing premium features

---

## Step 5: Verify in Stripe Dashboard

### 5.1 Check Subscription Created
1. Go to Stripe Dashboard → Customers
2. Find the customer you just created
3. Click on them → Should show active subscription
4. Verify subscription shows "100% off" for first billing cycle

### 5.2 Check Promotion Code Usage
1. Go to Stripe Dashboard → Products → Promotion codes
2. Click on "PAPERCLIP"
3. Should show "Times redeemed: 1" (or however many tests you did)

---

## Step 6: Test User Experience

### 6.1 Test Premium Features
1. Log into the account that used PAPERCLIP
2. Try generating lessons or using premium features
3. Verify everything works as expected

### 6.2 Test After 30 Days (Optional)
For a real test, you'd wait 30 days to verify Stripe automatically charges. For testing, you can:
1. Check the subscription in Stripe Dashboard
2. See that next billing date is 30 days from subscription start
3. Use Stripe's simulation tools if available

---

## Troubleshooting

### If Setup Script Fails
**Error**: "STRIPE_SECRET_KEY environment variable is required"
**Solution**: Make sure your `.env` file has the production Stripe secret key

### If Component Not Found
**Error**: Module not found: StripePromoCodeInput
**Solution**: Make sure you've pulled the latest code and the file exists at `src/components/premium/StripePromoCodeInput.tsx`

### If Checkout Returns Error
**Error**: "Promotion code 'PAPERCLIP' is invalid or expired"
**Solution**: 
1. Verify the setup script ran successfully
2. Check Stripe Dashboard to confirm promotion codes exist
3. Make sure you're using production Stripe keys

### If Webhook Fails
**Error**: User doesn't get premium status after checkout
**Solution**:
1. Check Stripe Dashboard → Webhooks
2. Verify webhook endpoint is working
3. Check webhook logs for errors
4. This should use your existing webhook that works for paid subscriptions

---

## Quick Testing Script

Save this as `quick-test.js` to test the API directly:

```javascript
// Test the checkout API directly
const testData = {
  priceId: "price_YOUR_ACTUAL_PRICE_ID", // Replace with real price ID
  billingPeriod: "monthly",
  promoCode: "PAPERCLIP",
  userId: "test-user-id",
  email: "test@example.com",
  successUrl: "https://your-app.com/dashboard?upgraded=true",
  cancelUrl: "https://your-app.com/pricing"
};

fetch('https://your-app.com/api/stripe/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));
```

---

## Success Indicators

✅ **Setup successful**: Stripe Dashboard shows coupons and promotion codes  
✅ **Component working**: Promo input appears on pricing page  
✅ **Validation working**: Invalid codes show errors, valid codes redirect to Stripe  
✅ **Checkout working**: Stripe shows $0.00 with discount applied  
✅ **Subscription created**: User gets premium status after completing checkout  
✅ **Webhook working**: Premium features are accessible  

If all these work, your Stripe promo code system is ready for production! 🎉