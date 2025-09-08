import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

interface IncrementUsageRequest {
  userId?: string;
  fingerprintHash: string;
  sessionId: string;
  userAgent: string;
  lessonData?: any;
  timestamp: string;
}

/**
 * Increment usage count for lesson generation
 * POST /api/usage/increment
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Usage tracking API called');
    
    // Use service role key for API routes to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Prefer service role key for backend operations, fallback to anon key
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    console.log('🔧 Environment check:', {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
      usingServiceKey: !!supabaseServiceKey,
      usingAnonKey: !supabaseServiceKey && !!supabaseAnonKey,
      keyPresent: !!supabaseKey
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
    }
    
    // Create Supabase client with appropriate key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body: IncrementUsageRequest = await request.json();
    const { userId, fingerprintHash, sessionId, userAgent, lessonData, timestamp } = body;
    console.log('📊 Request body:', { userId: userId ? 'present' : 'null', fingerprintHash: fingerprintHash ? 'present' : 'null', sessionId: sessionId ? 'present' : 'null' });

    // Validate required fields
    if (!fingerprintHash || !sessionId) {
      console.log('❌ Missing required tracking data');
      return NextResponse.json(
        { error: 'Missing required tracking data' },
        { status: 400 }
      );
    }

    // Get client IP and hash it for privacy
    const clientIP = getClientIP(request);
    const ipHash = hashString(clientIP);
    const userAgentHash = hashString(userAgent || '');
    const currentMonth = getCurrentMonth();
    const currentYear = new Date().getFullYear();
    
    // Check if this is localhost/development environment
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'unknown';
    
    console.log('🏷️ Generated hashes and dates:', { 
      currentMonth, 
      currentYear, 
      clientIP: isLocalhost ? 'localhost' : 'external',
      isLocalhost 
    });

    // Test Supabase connection with simpler query
    console.log('🔗 Testing Supabase connection...');
    try {
      const { error: testError } = await supabase.from('usage_tracking').select('id').limit(1);
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError);
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      console.log('✅ Supabase connected successfully');
    
    // Add logging to track actual lesson count progression
    console.log('📈 Current user session:', { 
      userId: userId === 'null' ? 'anonymous' : userId,
      fingerprintHash: fingerprintHash.substring(0, 8) + '...'
    });
    } catch (supabaseError) {
      console.error('❌ Supabase connection error:', supabaseError);
      throw supabaseError;
    }

    // Check if user is premium first (unlimited access)
    if (userId) {
      console.log('👤 Checking premium status for user:', userId);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_status, subscription_end_date')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.log('❌ User lookup error:', userError);
      }

      if (userData) {
        const isSubscriptionActive = userData.subscription_end_date 
          ? new Date(userData.subscription_end_date) > new Date()
          : userData.subscription_status === 'premium';
        
        if (isSubscriptionActive) {
          // Premium users have unlimited access - still track for analytics but don't limit
          await trackPremiumUsage(supabase, userId, lessonData, fingerprintHash, ipHash, sessionId, userAgent);
          
          return NextResponse.json({
            success: true,
            lessonCount: 0,
            remainingLessons: 999,
            canAccess: true,
            subscriptionStatus: 'premium',
            resetDate: getNextMonthStart().toISOString(),
            userId
          });
        }
      }
    }

    // For free users, check current usage and enforce limits
    const FREE_LIMIT = 5;

    // Get existing usage - check all tracking methods to prevent circumvention
    console.log('📊 Querying usage tracking for month:', currentMonth);
    console.log('🔍 Search parameters:', {
      month: currentMonth,
      fingerprintHash: fingerprintHash?.substring(0, 10) + '...',
      ipHash: ipHash?.substring(0, 10) + '...',
      userId: userId === 'null' ? null : userId
    });
    
    // For localhost/development, use file-based tracking but don't force error
    if (isLocalhost) {
      console.log('🏠 Using localhost/development mode - file-based tracking');
      const FREE_LIMIT = 5;
      
      try {
        const fs = require('fs');
        const path = require('path');
        const tmpDir = require('os').tmpdir();
        const counterFile = path.join(tmpDir, `usage_${currentMonth}_${fingerprintHash.substring(0, 16)}.txt`);
        
        let currentCount = 0;
        if (fs.existsSync(counterFile)) {
          currentCount = parseInt(fs.readFileSync(counterFile, 'utf8') || '0');
        }
        
        // Check limit before incrementing
        if (currentCount >= FREE_LIMIT) {
          return NextResponse.json({
            success: false,
            lessonCount: currentCount,
            remainingLessons: 0,
            canAccess: false,
            subscriptionStatus: 'free',
            resetDate: getNextMonthStart().toISOString(),
            limitReached: true,
            userId
          });
        }
        
        // Increment and save
        const newCount = currentCount + 1;
        fs.writeFileSync(counterFile, newCount.toString());
        
        return NextResponse.json({
          success: true,
          lessonCount: newCount,
          remainingLessons: Math.max(0, FREE_LIMIT - newCount),
          canAccess: newCount <= FREE_LIMIT,
          subscriptionStatus: 'free',
          resetDate: getNextMonthStart().toISOString(),
          shouldPromptAccount: newCount >= 3 && !(userId && userId !== 'null'),
          isLastFreeLesson: newCount === FREE_LIMIT,
          userId: (userId && userId !== 'null') ? userId : null
        });
      } catch (fileError) {
        console.warn('📁 File-based tracking failed, will use database fallback:', fileError);
        // Continue to database logic instead of throwing error
      }
    }
    
    // For production environments only
    let usageRecords = [];
    let fetchError = null;
    
    {
      // For production, use multiple tracking methods
      const queries = [];
      
      queries.push(
        supabase
          .from('usage_tracking')
          .select('*')
          .eq('month', currentMonth)
          .eq('fingerprint_hash', fingerprintHash)
      );
      
      queries.push(
        supabase
          .from('usage_tracking')
          .select('*')
          .eq('month', currentMonth)
          .eq('ip_hash', ipHash)
      );
      
      if (userId && userId !== 'null') {
        queries.push(
          supabase
            .from('usage_tracking')
            .select('*')
            .eq('month', currentMonth)
            .eq('user_id', userId)
        );
      }
      
      const queryResults = await Promise.all(queries);
      const allRecords = queryResults.flatMap(result => result.data || []);
      usageRecords = allRecords.filter((record, index, arr) => 
        arr.findIndex(r => r.id === record.id) === index
      );
      
      fetchError = queryResults.find(result => result.error)?.error;
    }

    if (fetchError) {
      console.error('❌ Usage fetch error:', fetchError);
      throw fetchError;
    }
    
    console.log('📈 Found usage records:', usageRecords?.length || 0);
    console.log('📊 Usage records details:', usageRecords?.map(r => ({ 
      id: r.id, 
      user_id: r.user_id, 
      lesson_count: r.lesson_count,
      fingerprint_hash: r.fingerprint_hash?.substring(0, 8) + '...',
      ip_hash: r.ip_hash?.substring(0, 8) + '...'
    })));
    
    // DEBUG: Query all records for this month to see what exists
    const { data: allRecords } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('month', currentMonth);
    
    console.log('🔍 DEBUG - All records in database for month:', currentMonth, ':', allRecords?.length || 0);
    console.log('🔍 DEBUG - All record details:', allRecords?.map(r => ({
      id: r.id,
      user_id: r.user_id,
      lesson_count: r.lesson_count,
      fingerprint_hash: r.fingerprint_hash?.substring(0, 10) + '...',
      ip_hash: r.ip_hash?.substring(0, 10) + '...',
      month: r.month
    })));

    // Calculate current usage from all tracking methods
    let currentUsage = 0;
    let existingRecord: any = null;

    if (usageRecords && usageRecords.length > 0) {
      // Take the maximum usage count from any tracking method
      currentUsage = Math.max(...usageRecords.map(record => record.lesson_count || 0));
      
      // Prefer user-specific record if available
      existingRecord = usageRecords.find(record => record.user_id === (userId === 'null' ? null : userId)) || usageRecords[0];
      
      console.log('📊 Existing record found:', {
        id: existingRecord?.id,
        currentUsage,
        will_update: true
      });
    } else {
      console.log('📊 No existing records - will create new record');
    }

    // Check if user has already exceeded the limit
    if (currentUsage >= FREE_LIMIT) {
      // Track the blocked attempt
      await supabase
        .from('feature_usage')
        .insert({
          user_id: (userId && userId !== 'null') ? userId : null,
          feature_name: 'lesson_generation',
          feature_category: 'generation',
          action: 'blocked',
          metadata: {
            currentUsage,
            limit: FREE_LIMIT,
            reason: 'monthly_limit_exceeded',
            lessonData: lessonData || {}
          },
          fingerprint_hash: fingerprintHash,
          ip_hash: ipHash
        });

      // Track analytics event for limit reached
      await supabase
        .from('analytics_events')
        .insert({
          user_id: (userId && userId !== 'null') ? userId : null,
          session_id: sessionId,
          event_name: 'paywall_encountered',
          event_category: 'conversion_funnel',
          event_properties: {
            lessonCount: currentUsage,
            limit: FREE_LIMIT,
            hasAccount: !!userId
          },
          fingerprint_hash: fingerprintHash,
          ip_hash: ipHash,
          user_agent: userAgent
        });

      return NextResponse.json({
        success: false,
        lessonCount: currentUsage,
        remainingLessons: 0,
        canAccess: false,
        subscriptionStatus: 'free',
        resetDate: getNextMonthStart().toISOString(),
        limitReached: true,
        userId
      });
    }

    // Increment usage count
    const newLessonCount = currentUsage + 1;

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('usage_tracking')
        .update({
          lesson_count: newLessonCount,
          user_id: (userId && userId !== 'null') ? userId : existingRecord.user_id, // Update user_id if user just signed up
          last_use_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Usage update error:', updateError);
        throw updateError;
      }
    } else {
      // Create new usage record
      const insertData = {
        user_id: (userId && userId !== 'null') ? userId : null,
        month: currentMonth,
        year: currentYear,
        lesson_count: newLessonCount,
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        session_token: sessionId,
        first_use_at: new Date().toISOString(),
        last_use_at: new Date().toISOString()
      };
      
      console.log('💾 Inserting new record:', {
        ...insertData,
        fingerprint_hash: insertData.fingerprint_hash?.substring(0, 10) + '...',
        ip_hash: insertData.ip_hash?.substring(0, 10) + '...'
      });
      
      const { data: insertResult, error: insertError } = await supabase
        .from('usage_tracking')
        .insert(insertData)
        .select('*');

      if (insertError) {
        console.error('Usage insert error:', insertError);
        throw insertError;
      } else {
        console.log('✅ Successfully inserted record:', insertResult?.[0]?.id);
      }
    }

    const remainingLessons = Math.max(0, FREE_LIMIT - newLessonCount);
    const canAccess = newLessonCount <= FREE_LIMIT;

    // Track successful lesson generation
    await supabase
      .from('feature_usage')
      .insert({
        user_id: userId || null,
        feature_name: 'lesson_generation',
        feature_category: 'generation',
        action: 'completed',
        metadata: {
          lessonCount: newLessonCount,
          remainingLessons,
          lessonData: lessonData || {}
        },
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash
      });

    // Track analytics events based on usage
    let eventName = 'lesson_generated';
    if (newLessonCount === 3 && !userId) {
      eventName = 'account_prompt_trigger'; // Trigger account creation prompt
    } else if (newLessonCount === FREE_LIMIT) {
      eventName = 'limit_warning_shown'; // Last free lesson
    }

    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        event_name: eventName,
        event_category: 'conversion_funnel',
        event_properties: {
          lessonCount: newLessonCount,
          remainingLessons,
          isLastFreeLesson: newLessonCount === FREE_LIMIT,
          shouldPromptAccount: newLessonCount === 3 && !(userId && userId !== 'null')
        },
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash,
        user_agent: userAgent
      });

    const responseData = {
      success: true,
      lessonCount: newLessonCount,
      remainingLessons,
      canAccess,
      subscriptionStatus: 'free',
      resetDate: getNextMonthStart().toISOString(),
      shouldPromptAccount: newLessonCount >= 3 && !(userId && userId !== 'null'),
      isLastFreeLesson: newLessonCount === FREE_LIMIT,
      userId: (userId && userId !== 'null') ? userId : null
    };
    
    console.log('✅ Usage tracking successful:', responseData);
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Usage increment failed:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    });
    
    // Fallback response for development/demo mode
    // Parse request body for fallback data
    let fallbackBody;
    try {
      const bodyText = await request.text();
      fallbackBody = JSON.parse(bodyText);
    } catch {
      fallbackBody = { userId: null, fingerprintHash: 'fallback', sessionId: 'fallback' };
    }
    
    const fallbackUserId = fallbackBody.userId;
    const fallbackFingerprintHash = fallbackBody.fingerprintHash;
    const fallbackSessionId = fallbackBody.sessionId;
    
    console.log('🏠 LOCALHOST FALLBACK MODE - Using memory-based tracking');
    
    // For localhost, use a file-based counter to persist across requests
    const fs = require('fs');
    const path = require('path');
    const tmpDir = require('os').tmpdir();
    const currentMonth = getCurrentMonth();
    
    // Create a unique counter file based on session and month
    const counterFile = path.join(tmpDir, `usage_${currentMonth}_${fallbackFingerprintHash.substring(0, 16)}.txt`);
    
    let fallbackLessonCount = 1;
    try {
      if (fs.existsSync(counterFile)) {
        const existingCount = parseInt(fs.readFileSync(counterFile, 'utf8') || '0');
        fallbackLessonCount = existingCount + 1;
        console.log('📁 Found existing localhost counter:', existingCount, '→', fallbackLessonCount);
      } else {
        console.log('📁 Creating new localhost counter file');
      }
      
      // Write updated count back to file
      fs.writeFileSync(counterFile, fallbackLessonCount.toString());
      console.log('💾 Updated localhost counter to:', fallbackLessonCount);
    } catch (fileError) {
      console.warn('📁 File-based counter failed, using session-based fallback:', fileError);
      fallbackLessonCount = 1; // Default fallback
    }
    const FREE_LIMIT = 5;
    
    return NextResponse.json({
      success: true,
      lessonCount: fallbackLessonCount,
      remainingLessons: Math.max(0, FREE_LIMIT - fallbackLessonCount),
      canAccess: fallbackLessonCount <= FREE_LIMIT,
      subscriptionStatus: 'free',
      resetDate: getNextMonthStart().toISOString(),
      shouldPromptAccount: fallbackLessonCount >= 3 && !(fallbackUserId && fallbackUserId !== 'null'),
      isLastFreeLesson: fallbackLessonCount === FREE_LIMIT,
      userId: (fallbackUserId && fallbackUserId !== 'null') ? fallbackUserId : null
    });
  }
}

// Helper function to track premium user usage (for analytics only)
async function trackPremiumUsage(
  supabaseClient: any,
  userId: string, 
  lessonData: any, 
  fingerprintHash: string, 
  ipHash: string, 
  sessionId: string, 
  userAgent: string
) {
  try {
    // Track premium analytics (feature_usage table was removed in cleanup)
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id: userId,
        session_id: sessionId,
        event_name: 'premium_lesson_generated',
        event_category: 'premium_usage',
        event_properties: {
          subscription: 'premium',
          unlimited: true,
          lessonData: lessonData || {}
        },
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash,
        user_agent: userAgent
      });
  } catch (error) {
    console.error('Premium usage tracking failed:', error);
    // Don't throw - this is just analytics
  }
}

// Helper functions
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || xRealIP || xForwardedFor?.split(',')[0] || 'unknown';
}

function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}