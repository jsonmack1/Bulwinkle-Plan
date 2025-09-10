# Stripe Promo Code Duration Controls 📅

## How Stripe Handles Promo Code Duration

Stripe provides several options for controlling promo code duration:

### 1. Duration Types

**`once`** - Applies discount to the first billing cycle only
- Perfect for "30 days free" or "first month free"
- User gets 100% off first payment, then pays normal price

**`repeating`** - Applies discount for multiple billing cycles  
- Use `duration_in_months` to specify how many months
- Great for "3 months free" promotions

**`forever`** - Applies discount to all future billing cycles
- Permanent discount (use carefully!)

### 2. PAPERCLIP Implementation

For **30 days free premium subscription**:

```javascript
const coupon = await stripe.coupons.create({
  id: 'paperclip-30days-free',
  duration: 'once',        // First billing cycle only
  percent_off: 100,        // 100% off = free
  max_redemptions: 1000    // Limit total uses
});
```

### 3. How It Works in Practice

**User Journey with PAPERCLIP:**
1. User enters "PAPERCLIP"
2. Stripe checkout shows: ~~$29.99~~ **$0.00** (first month)
3. User completes "payment" (free)
4. Subscription starts with 30-day free period
5. After 30 days, Stripe automatically charges normal price
6. User continues as premium subscriber

### 4. Advanced Duration Controls

**Specific Month Duration:**
```javascript
{
  duration: 'repeating',
  duration_in_months: 3,  // Exactly 3 months free
  percent_off: 100
}
```

**Trial Extension (Alternative Approach):**
```javascript
// Instead of coupon, you could use Stripe's trial_period_days
subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 30  // 30 days free trial
});
```

### 5. Redemption Limits

Stripe also supports:
- **Total redemption limits**: `max_redemptions: 1000`
- **Per-customer limits**: Customer can only use once
- **Expiration dates**: Coupon expires after certain date
- **Minimum order values**: Only applies to orders over $X

### 6. Production Considerations

**For Production Use:**
- Set reasonable `max_redemptions` 
- Consider adding expiration dates
- Monitor usage in Stripe dashboard
- Set up alerts for high redemption volumes

### 7. Testing Duration

**In Test Mode:**
- Create test coupons with short durations (1 day)
- Use Stripe's time simulation tools
- Test subscription lifecycle (free → paid)

### 8. Current PAPERCLIP Setup

Our current implementation:
- **Duration**: `once` (30 days free, then normal billing)
- **Discount**: 100% off first payment
- **Limit**: 1000 total redemptions
- **Result**: Users get 30 days free premium, then automatically billed monthly

This is the **standard approach** for "30 days free" promotions and works perfectly with your existing subscription flow.

## Alternative: Trial-Based Approach

If you prefer trials over coupons:

```javascript
// In create-checkout, instead of discount:
sessionParams.subscription_data = {
  trial_period_days: 30
};
```

Both approaches work well - coupons are more flexible for mixed promotions.