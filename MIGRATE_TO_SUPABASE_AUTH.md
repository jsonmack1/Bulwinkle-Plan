# Migration from Mock Auth to Supabase Auth

## Current Situation

❌ **CRITICAL ISSUE**: Your app is using a mock authentication system in production that:
- Stores passwords in localStorage (major security risk)
- Creates inconsistent user data between localStorage and Supabase
- Doesn't provide proper authentication security
- Makes it difficult to manage user accounts properly

## Immediate Fix Applied

I've patched the current system to:
- ✅ Create users in Supabase when they sign up
- ✅ Sync login with Supabase user data
- ✅ Maintain backward compatibility

**BUT** you should migrate to proper Supabase Auth as soon as possible.

---

## Phase 1: Test Current Fixes (DO THIS NOW)

### Test User Creation:
1. **Create a new account** on your app
2. **Check Supabase Dashboard → Authentication → Users** - you should see the new user
3. **Check your `users` table** - you should see user data there too
4. **Try subscribing** - webhook should find and update the user properly

If users still aren't appearing, check browser console for errors.

---

## Phase 2: Migrate to Supabase Auth (RECOMMENDED)

### Benefits of Supabase Auth:
- ✅ Proper password hashing and security
- ✅ Email verification
- ✅ Password reset functionality  
- ✅ OAuth integration (Google, GitHub, etc.)
- ✅ JWT tokens for secure API access
- ✅ Built-in user management

### Migration Steps:

#### Step 1: Enable Supabase Auth
```bash
# In Supabase Dashboard → Authentication → Settings
# Enable email auth and any OAuth providers you want
```

#### Step 2: Update Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### Step 3: Install Supabase Auth Helpers
```bash
npm install @supabase/auth-helpers-nextjs
```

#### Step 4: Replace Mock Auth Service

Create `src/lib/supabaseAuth.ts`:
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../types/database'

export const supabaseAuth = createClientComponentClient<Database>()

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      }
    }
  })
  
  if (error) throw error
  
  // Create user in your users table
  if (data.user) {
    const { error: dbError } = await supabaseAuth.rpc('create_user_by_email', {
      p_email: email,
      p_name: name,
      p_stripe_customer_id: null
    })
    
    if (dbError) console.warn('Failed to create user in users table:', dbError)
  }
  
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabaseAuth.auth.getUser()
  return user
}
```

#### Step 5: Update Components

Replace `authService` calls with Supabase Auth:

```typescript
// OLD
import { authService } from '../lib/auth'

// NEW  
import { signUp, signIn, signOut, getCurrentUser } from '../lib/supabaseAuth'
```

#### Step 6: Add Auth Middleware

Update `middleware.ts`:
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}
```

#### Step 7: Update API Routes

Replace mock user ID checks with proper Supabase auth:

```typescript
// OLD
const userId = body.userId

// NEW
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
const supabase = createRouteHandlerClient({ cookies })
const { data: { user } } = await supabase.auth.getUser()
const userId = user?.id
```

#### Step 8: Migrate Existing Users

Run this script to migrate localStorage users to Supabase Auth:

```sql
-- In Supabase SQL Editor
-- This will create auth users for existing users in your users table
-- (You'll need to handle this carefully with password reset emails)
```

---

## Phase 3: Cleanup (After Migration)

1. **Remove mock auth files:**
   - `src/lib/auth.ts`
   - `src/types/auth.ts` (if no longer needed)

2. **Update all components** to use Supabase Auth

3. **Test thoroughly:**
   - Sign up flow
   - Login flow  
   - Password reset
   - Subscription flow
   - API authentication

---

## Why This Matters for Your Business

### Current Risks:
- 🚨 **Security vulnerability**: Passwords stored in plain text in browser
- 🚨 **User experience issues**: Inconsistent account state
- 🚨 **Compliance issues**: Not following security best practices
- 🚨 **Scalability problems**: Won't work with multiple devices/browsers

### After Migration:
- ✅ **Enterprise-grade security**: Proper password hashing, JWT tokens
- ✅ **Better UX**: Password reset, email verification, remember me
- ✅ **Compliance ready**: Follows security best practices
- ✅ **Scalable**: Works across devices, browsers, mobile apps

---

## Quick Test for Current Fix

**Before migration, test that the immediate fix works:**

1. Open browser dev tools → Console
2. Go to your app and create a new account
3. Look for success message: `✅ Created user in Supabase: [uuid]`
4. Check Supabase users table - you should see the new user
5. Try subscribing - it should work without errors

If this works, you've fixed the immediate issue. But please migrate to proper auth ASAP for security reasons.

---

## Need Help?

The immediate fixes should resolve your account creation issue. For the full migration:

1. **Start with Phase 1** to verify the fix works
2. **Plan the migration** during a low-traffic period  
3. **Test thoroughly** in a staging environment first
4. **Have a rollback plan** ready

The mock auth system is a significant security risk that should be addressed soon, but the immediate fixes will get your subscriptions working properly.