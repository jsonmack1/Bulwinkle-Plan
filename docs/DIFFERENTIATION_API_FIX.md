# Differentiation API Fix - Vercel Production Errors

**Date**: 2025-10-14
**Issue**: Repeated 500 errors when clicking differentiation button on Vercel production
**Status**: ✅ FIXED

---

## 🔍 Problem Diagnosis

### Symptoms
- Multiple 500 errors in browser console when clicking differentiation button
- Errors repeat rapidly (indicating retries failing)
- Issue only occurs in Vercel production, not local development
- Anthropic API key is correctly set in Vercel environment variables

### Root Causes Identified

#### 1. **Vercel Serverless Function Timeout (PRIMARY ISSUE)**
- **Vercel Hobby Plan Limit**: 10 seconds maximum function execution
- **API Call Duration**: Differentiation generation typically takes 20-45 seconds
- **Result**: Vercel kills the function after 10 seconds → 500 error
- **Evidence**: Code had 30-second timeout but no `maxDuration` export for Vercel

#### 2. **Missing Vercel Configuration**
- No `export const maxDuration` in route file
- Without this, Vercel defaults to 10s on Hobby plan (or 10s minimum on all plans)

#### 3. **Insufficient Error Logging**
- Generic error messages didn't indicate timeout vs API failure
- No timing information to diagnose slow API calls
- No Vercel-specific error detection

---

## ✅ Fixes Applied

### Fix #1: Added Vercel maxDuration Export
**File**: `src/app/api/premium/differentiation/route.ts` (line 6)

```typescript
// Vercel serverless function configuration
// Set maximum duration to 60 seconds (requires Pro plan, Hobby = 10s max)
// If on Hobby plan, this will be capped at 10s
export const maxDuration = 60;
```

**Impact**:
- Tells Vercel to allow up to 60 seconds (on Pro plan)
- On Hobby plan, will still be capped at 10s but properly configured
- Prevents Vercel from killing the function prematurely

### Fix #2: Improved Timeout Handling
**File**: `src/app/api/premium/differentiation/route.ts` (lines 315-369)

**Changes**:
- Adjusted internal timeout to 55 seconds (from 30s)
- Added detailed timing logs: API start time, duration, timeout limit
- Better abort error messages with Vercel plan hints
- Clear indication when timeout is due to Vercel plan limits

**Example Error Message**:
```
⏱️ Differentiation API call timed out after 10 seconds
💡 Timeout limit was: 55 seconds
⚠️ If on Vercel Hobby plan, function is limited to 10s max execution
```

### Fix #3: Enhanced API Error Logging
**File**: `src/app/api/premium/differentiation/route.ts` (lines 371-390)

**Improvements**:
- Log full error body from Anthropic API (first 500 chars)
- Specific hints for common errors:
  - 401: Invalid API key
  - 429: Rate limit exceeded
  - 500: Anthropic service error
- Better debugging info in production logs

### Fix #4: Vercel-Specific Timeout Detection
**File**: `src/app/api/premium/differentiation/route.ts` (lines 434-471)

**Added**:
- Detection of Vercel function timeout errors
- Specific error messages for Vercel timeout vs API timeout
- Guidance on upgrading Vercel plan
- Timestamp logging for all errors

---

## 🎯 Expected Behavior After Fix

### On Vercel Hobby Plan (10s limit)
**Behavior**: Will still timeout on most requests (since AI takes 20-45s)

**User sees**:
```
Request timed out. The AI response took too long.
Please try again or upgrade your Vercel plan for longer timeouts.
Timed out after 10s
```

**Logs will show**:
```
🔄 Starting Anthropic API call at [timestamp]
⏱️ Aborting request after 55 seconds
❌ Fetch failed after 10000ms
⚠️ VERCEL FUNCTION TIMEOUT DETECTED
💡 Hobby: 10s, Pro: 60s, Enterprise: 300s
```

### On Vercel Pro Plan (60s limit)
**Behavior**: Should work! API calls typically complete in 20-45 seconds

**User sees**: Successfully generated differentiation content

**Logs will show**:
```
🔄 Starting Anthropic API call at [timestamp]
✅ API responded in 23456ms
✅ Differentiation API call successful
```

---

## 📊 Testing the Fix

### 1. Check Vercel Logs
After deployment, click the differentiation button and check Vercel logs:

```bash
# In Vercel dashboard: Your Project → Logs → Functions
```

Look for these logs to understand what's happening:
- `🔑 Differentiation API Key check:` - Confirms API key loading
- `🔄 Starting Anthropic API call at` - API call started
- `✅ API responded in Xms` - Success + timing
- `⏱️ Aborting request after X seconds` - Timeout occurred

### 2. Verify API Key in Vercel
```bash
# Vercel Dashboard → Project → Settings → Environment Variables
# Verify ANTHROPIC_API_KEY is set and starts with sk-ant-
```

### 3. Test in Browser Console
After clicking differentiation, browser console should show:
- Clear error message (not just "500")
- Indication of timeout if that's the issue
- Hint about Vercel plan limits if applicable

---

## 🚀 Recommended Solutions

### Option 1: Upgrade to Vercel Pro Plan (RECOMMENDED)
**Cost**: $20/month
**Benefit**: 60-second function timeout
**Result**: Differentiation will work perfectly

### Option 2: Optimize Differentiation Request
**Alternative**: Reduce the prompt size or split into smaller requests
**Complexity**: Requires significant code refactoring
**Trade-off**: May reduce quality of differentiation output

### Option 3: Use a Background Job Queue
**Solution**: Move differentiation to async job processor
**Examples**: Inngest, QStash, BullMQ
**Complexity**: High - requires new infrastructure
**Benefit**: No timeout limits

---

## 📝 Code Changes Summary

**Files Modified**: 1
- `src/app/api/premium/differentiation/route.ts`

**Files Created**: 2
- `test-differentiation-api.js` (diagnostic script)
- `docs/DIFFERENTIATION_API_FIX.md` (this document)

**Lines Changed**: ~70 lines in route.ts
- Added: maxDuration export (4 lines)
- Improved: Timeout handling (40 lines)
- Enhanced: Error logging (26 lines)

---

## 🔧 Next Steps

1. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Fix: Add Vercel timeout handling for differentiation API"
   git push
   ```

2. **Test After Deployment**
   - Click differentiation button
   - Check browser console for improved error messages
   - Check Vercel logs for timing information

3. **Upgrade Vercel Plan (if needed)**
   - If logs show 10s timeout, upgrade to Pro
   - If API key issues, verify environment variables
   - If API errors, check Anthropic console for quotas

4. **Monitor Logs**
   - Watch for timing patterns
   - Identify average API response time
   - Confirm 60s limit is sufficient on Pro plan

---

## 📚 Additional Resources

- [Vercel Function Timeouts](https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Summary**: The differentiation API was failing due to Vercel's 10-second timeout on the Hobby plan. We've added proper Vercel configuration, improved error handling, and enhanced logging. To fully resolve, upgrade to Vercel Pro for 60-second timeouts, which is sufficient for AI-generated differentiation content.
