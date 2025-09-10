# Test: Promo Code Account Creation Flow 🧪

## Flow Overview

This tests the complete promo code flow for anonymous users, mirroring the monthly/annual plan workflow.

## Test Scenarios

### Scenario 1: Anonymous User with Promo Code ✅

**Steps:**
1. Open pricing page in incognito/private browser window
2. Scroll down to promo code section
3. Click "🎟️ Have a promo code?"
4. Enter "PAPERCLIP"
5. Click "Apply Code"

**Expected Result:**
- Should show account creation modal
- Modal should display "Promo Code: PAPERCLIP"
- Modal should show "$0" (free with promo)
- User can create account or log in

### Scenario 2: Account Creation with Promo Code ✅

**After Scenario 1:**
1. Fill in email and password in account creation modal
2. Click "Create Account"

**Expected Result:**
- Account gets created
- Modal closes
- Automatically redirects to Stripe checkout
- Stripe shows $0.00 due to PAPERCLIP promo
- User can complete "payment" (free)
- Returns to dashboard with Premium status

### Scenario 3: Logged-In User with Promo Code ✅

**Steps:**
1. Log in to existing account
2. Go to pricing page
3. Enter "PAPERCLIP" in promo code field
4. Click "Apply Code"

**Expected Result:**
- No account modal (user already logged in)
- Directly redirects to Stripe checkout
- Stripe shows $0.00 due to promo code
- User can complete checkout

### Scenario 4: Invalid Promo Code ✅

**Steps:**
1. Enter "INVALIDCODE123"
2. Click "Apply Code"

**Expected Result:**
- Shows error message: "Promotion code 'INVALIDCODE123' is invalid or expired"
- No account modal appears

## Technical Implementation

### Components Updated:
- `StripePromoCodeInput.tsx`: Added account requirement check
- `pricing/page.tsx`: Added promo code account workflow
- `AccountCreationModal`: Updated to show promo code info

### Flow Logic:
```typescript
// 1. User enters promo code
handleApplyPromoCode() 
  → checks if user logged in
  → if not: calls onAccountRequired()
  → if yes: proceeds to Stripe checkout

// 2. Account creation required
handlePromoAccountRequired()
  → stores promo code in pendingPromoCode
  → shows account creation modal

// 3. After account creation
handleAccountCreated()
  → checks if pendingPromoCode exists
  → if yes: applies promo code
  → if no: proceeds with regular plan

// 4. Apply promo after login
applyPromoCodeAfterLogin()
  → creates Stripe checkout with promo code
  → redirects to Stripe (same as logged-in flow)
```

## Analytics Tracking

New events tracked:
- `promo_account_required`: When anonymous user tries promo code
- `promo_checkout_created_after_login`: When promo applied after account creation

## Error Handling

- Invalid promo codes show clear error messages
- Modal can be cancelled (clears pending promo code)
- Network errors are handled gracefully
- Same error handling as monthly/annual plans

## Success Indicators

✅ **Anonymous user flow**: Promo code → Account creation → Stripe checkout → Premium status  
✅ **Logged-in user flow**: Promo code → Stripe checkout → Premium status  
✅ **Error handling**: Invalid codes show proper errors  
✅ **Modal integration**: Uses existing AccountCreationModal  
✅ **Consistent UX**: Same pattern as monthly/annual plans  

This ensures promo codes work exactly like the proven monthly/annual plan workflow! 🎉