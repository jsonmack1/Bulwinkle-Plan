# Stripe Promo Code Implementation Guide 🎯

## Overview

This guide implements Stripe native promotion codes to replace the custom promo system. This leverages the existing working Stripe subscription flow instead of fighting database RLS issues.

## Why This Approach Works

**✅ Proven Foundation**: Your Stripe subscription flow already works perfectly  
**✅ Native Integration**: Uses Stripe's built-in promo code system  
**✅ Reliable Webhooks**: Existing webhook handlers will process free subscriptions  
**✅ Automatic UI Updates**: Existing subscription refresh system will work  

## Implementation Steps

### Step 1: Set Up Stripe Promotion Codes

```bash
# Run the setup script to create coupons and promotion codes in Stripe
node setup-stripe-promo-codes.js
```

This creates:
- `PAPERCLIP` - 100% off for 1 month (once)
- `TELESCOPE2025` - 100% off for 3 months (repeating)  
- `MIDNIGHT50` - 50% off first payment (once)

### Step 2: Update Pricing Page Components

Replace the existing `PromoCodeInput` with the new `StripePromoCodeInput`:

```tsx
// In your pricing page component
import { StripePromoCodeInput } from '../components/premium/StripePromoCodeInput';

// Replace old promo input with:
<StripePromoCodeInput
  priceId="price_your_monthly_id" // Your actual Stripe price ID
  billingPeriod="monthly"
  fingerprint={fingerprint}
  className="mt-4"
/>
```

### Step 3: Get Your Stripe Price IDs

Find your price IDs in the Stripe dashboard:
1. Go to Products → Your product → Pricing
2. Copy the price IDs (they start with `price_`)
3. Update the component props accordingly

### Step 4: Test the Complete Flow

```bash
# Start your dev server
npm run dev

# In another terminal, test the API
node test-stripe-promo-flow.js
```

## How It Works

### User Journey
1. **User enters "PAPERCLIP"** → StripePromoCodeInput component
2. **Component calls create-checkout API** → With promo code parameter  
3. **API validates promo code** → Against Stripe promotion codes
4. **Creates Stripe checkout session** → With 100% discount applied
5. **User redirected to Stripe** → Sees $0.00 checkout (free!)
6. **User completes "payment"** → Actually free due to discount
7. **Stripe webhook fires** → Your existing webhook handler
8. **Subscription created** → Via existing proven flow
9. **User returns to dashboard** → With Premium status ✅

### Technical Flow
```javascript
// 1. User enters promo code
PromoCodeInput → Stripe Checkout API

// 2. API validates and creates session
create-checkout.ts → stripe.promotionCodes.list() → stripe.checkout.sessions.create()

// 3. Stripe processes "payment" (free)
Stripe Checkout → Webhook → handleSubscriptionCreated()

// 4. UI updates
Webhook → Database → useRealSubscription → Header shows Premium ✅
```

## Files Created/Modified

### New Files
- `setup-stripe-promo-codes.js` - Creates Stripe coupons and promotion codes
- `StripePromoCodeInput.tsx` - New component using Stripe checkout
- `test-stripe-promo-flow.js` - Testing script
- `STRIPE_PROMO_ARCHITECTURE.md` - Architecture documentation

### Modified Files  
- `src/app/api/stripe/create-checkout/route.ts` - Added promotion code support

### Files to Update (Your Choice)
- Replace `PromoCodeInput` usage with `StripePromoCodeInput` in pricing pages
- Update price IDs in component props
- Optionally remove old custom promo code tables/APIs

## Environment Variables Required

Make sure these are set in your `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
# Your existing Stripe webhook secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing Checklist

### Manual Testing
- [ ] Run `setup-stripe-promo-codes.js` successfully
- [ ] See coupons created in Stripe dashboard
- [ ] Enter "PAPERCLIP" in StripePromoCodeInput  
- [ ] Redirected to Stripe checkout showing $0.00
- [ ] Complete checkout successfully
- [ ] Return to app with Premium status
- [ ] Header shows "💎 Premium"

### API Testing
- [ ] `node test-stripe-promo-flow.js` passes
- [ ] Valid promo codes create checkout sessions
- [ ] Invalid promo codes return proper errors
- [ ] Checkout URLs work in browser

## Advantages Over Custom System

| Custom System | Stripe Native |
|---------------|---------------|
| ❌ Database RLS issues | ✅ No database complexity |
| ❌ Manual subscription creation | ✅ Automatic via proven webhooks |  
| ❌ UI sync problems | ✅ Uses existing refresh system |
| ❌ Complex validation logic | ✅ Stripe handles validation |
| ❌ Security concerns | ✅ Stripe security built-in |
| ❌ Maintenance overhead | ✅ Minimal custom code |

## Migration Strategy

### Phase 1: Set Up (30 minutes)
1. Run setup script
2. Test API endpoints
3. Verify Stripe dashboard

### Phase 2: Frontend Update (1 hour)  
1. Add StripePromoCodeInput to pricing pages
2. Update price ID props
3. Test user flow

### Phase 3: Cleanup (Optional)
1. Remove old PromoCodeInput components
2. Remove custom promo database tables
3. Remove custom promo APIs

## Rollback Plan

If issues arise:
1. Keep old PromoCodeInput components
2. Switch back via feature flag
3. Stripe coupons can be deactivated instantly

## Expected Results

**Before**: Complex system with database issues, unreliable UI updates  
**After**: Simple, reliable system using proven Stripe infrastructure

**User Experience**: Enter PAPERCLIP → Stripe checkout ($0.00) → Premium access ✅

This leverages what already works (Stripe subscriptions) instead of fighting what doesn't (custom database logic).