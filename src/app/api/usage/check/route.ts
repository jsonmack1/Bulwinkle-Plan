import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '../../../../lib/supabase';

interface UsageCheckRequest {
  userId?: string;
  fingerprintHash: string;
  sessionId: string;
  userAgent: string;
}

interface UsageCheckResponse {
  userId?: string;
  lessonCount: number;
  remainingLessons: number;
  isOverLimit: boolean;
  subscriptionStatus: 'free' | 'premium';
  canAccess: boolean;
  resetDate: string;
  limitReached: boolean;
}

/**
 * Check current usage status for a user or anonymous session
 * POST /api/usage/check
 */
export async function POST(request: NextRequest) {
  try {
    const body: UsageCheckRequest = await request.json();
    const { userId, fingerprintHash, sessionId, userAgent } = body;

    // Validate required fields
    if (!fingerprintHash || !sessionId) {
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

    let userSubscriptionStatus: 'free' | 'premium' = 'free';
    let totalUsage = 0;

    // Check if user is premium first (if userId provided)
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_status, subscription_end_date')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        const isSubscriptionActive = userData.subscription_end_date 
          ? new Date(userData.subscription_end_date) > new Date()
          : userData.subscription_status === 'premium';
        
        userSubscriptionStatus = isSubscriptionActive ? 'premium' : 'free';
      }
    }

    // If user is premium, they have unlimited access
    if (userSubscriptionStatus === 'premium') {
      return NextResponse.json({
        userId,
        lessonCount: 0,
        remainingLessons: 999,
        isOverLimit: false,
        subscriptionStatus: 'premium',
        canAccess: true,
        resetDate: getNextMonthStart().toISOString(),
        limitReached: false
      });
    }

    // For free users, check usage across multiple tracking methods
    const queries = [];
    
    // Query by fingerprint hash
    queries.push(
      supabase
        .from('usage_tracking')
        .select('lesson_count, user_id')
        .eq('month', currentMonth)
        .eq('fingerprint_hash', fingerprintHash)
    );
    
    // Query by IP hash
    queries.push(
      supabase
        .from('usage_tracking')
        .select('lesson_count, user_id')
        .eq('month', currentMonth)
        .eq('ip_hash', ipHash)
    );
    
    // Query by user ID if available
    if (userId && userId !== 'null') {
      queries.push(
        supabase
          .from('usage_tracking')
          .select('lesson_count, user_id')
          .eq('month', currentMonth)
          .eq('user_id', userId)
      );
    }
    
    // Execute all queries and combine results
    const queryResults = await Promise.all(queries);
    const allRecords = queryResults.flatMap(result => result.data || []);
    const usageData = allRecords.filter((record, index, arr) => 
      arr.findIndex(r => r.user_id === record.user_id) === index // Remove duplicates by user_id
    );
    
    const usageError = queryResults.find(result => result.error)?.error;

    if (usageError) {
      console.error('Usage check error:', usageError);
      // Return conservative defaults on error
      return NextResponse.json({
        userId,
        lessonCount: 5,
        remainingLessons: 0,
        isOverLimit: true,
        subscriptionStatus: 'free',
        canAccess: false,
        resetDate: getNextMonthStart().toISOString(),
        limitReached: true
      });
    }

    // Calculate total usage from all tracking methods
    if (usageData && usageData.length > 0) {
      // Take the maximum usage count from any tracking method to prevent circumvention
      totalUsage = Math.max(...usageData.map(record => record.lesson_count || 0));
      
      // If we found usage linked to this user ID, use that
      const userSpecificUsage = usageData.find(record => record.user_id === userId);
      if (userSpecificUsage) {
        totalUsage = userSpecificUsage.lesson_count || 0;
      }
    }

    const FREE_LIMIT = 5;
    const remainingLessons = Math.max(0, FREE_LIMIT - totalUsage);
    const isOverLimit = totalUsage >= FREE_LIMIT;

    // Log the usage check for analytics
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        event_name: 'usage_check',
        event_category: 'freemium',
        event_properties: {
          lessonCount: totalUsage,
          remainingLessons,
          isOverLimit,
          subscriptionStatus: userSubscriptionStatus
        },
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash,
        user_agent: userAgent
      });

    const response: UsageCheckResponse = {
      userId,
      lessonCount: totalUsage,
      remainingLessons,
      isOverLimit,
      subscriptionStatus: userSubscriptionStatus,
      canAccess: !isOverLimit || (userSubscriptionStatus as string) === 'premium',
      resetDate: getNextMonthStart().toISOString(),
      limitReached: isOverLimit
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Usage check failed:', error);
    
    // Fallback response for development/demo mode
    const FREE_LIMIT = 5;
    const fallbackLessonCount = 0;
    
    return NextResponse.json({
      lessonCount: fallbackLessonCount,
      remainingLessons: FREE_LIMIT - fallbackLessonCount,
      isOverLimit: false,
      subscriptionStatus: 'free',
      canAccess: true,
      resetDate: getNextMonthStart().toISOString(),
      shouldPromptAccount: false,
      userId: null
    });
  }
}

/**
 * Increment usage count for lesson generation
 * This is called when a user generates a lesson
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fingerprintHash, sessionId, userAgent, lessonData } = body;

    if (!fingerprintHash || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required tracking data' },
        { status: 400 }
      );
    }

    const clientIP = getClientIP(request);
    const ipHash = hashString(clientIP);
    const userAgentHash = hashString(userAgent || '');
    const currentMonth = getCurrentMonth();
    const currentYear = new Date().getFullYear();

    // First check if user is premium (unlimited access)
    if (userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status, subscription_end_date')
        .eq('id', userId)
        .single();

      if (userData) {
        const isSubscriptionActive = userData.subscription_end_date 
          ? new Date(userData.subscription_end_date) > new Date()
          : userData.subscription_status === 'premium';
        
        if (isSubscriptionActive) {
          return NextResponse.json({
            success: true,
            lessonCount: 0,
            canAccess: true,
            subscriptionStatus: 'premium',
            resetDate: getNextMonthStart().toISOString()
          });
        }
      }
    }

    // For free users, increment usage count
    let usageQuery = supabase
      .from('usage_tracking')
      .select('*')
      .eq('month', currentMonth);

    // Handle null userId properly
    if (userId && userId !== 'null') {
      usageQuery = usageQuery.or(`user_id.eq.${userId},fingerprint_hash.eq.${fingerprintHash},ip_hash.eq.${ipHash}`);
    } else {
      usageQuery = usageQuery.or(`user_id.is.null,fingerprint_hash.eq.${fingerprintHash},ip_hash.eq.${ipHash}`);
    }
    
    const { data: existingUsage, error: fetchError } = await usageQuery.maybeSingle();

    let newLessonCount = 1;

    if (!fetchError && existingUsage) {
      // Update existing record
      newLessonCount = (existingUsage.lesson_count || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('usage_tracking')
        .update({
          lesson_count: newLessonCount,
          last_use_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUsage.id);

      if (updateError) {
        console.error('Usage update error:', updateError);
        throw updateError;
      }
    } else {
      // Create new usage record
      const { error: insertError } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId || null,
          month: currentMonth,
          year: currentYear,
          lesson_count: newLessonCount,
          fingerprint_hash: fingerprintHash,
          ip_hash: ipHash,
          user_agent_hash: userAgentHash,
          session_token: sessionId,
          first_use_at: new Date().toISOString(),
          last_use_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Usage insert error:', insertError);
        throw insertError;
      }
    }

    const FREE_LIMIT = 5;
    const remainingLessons = Math.max(0, FREE_LIMIT - newLessonCount);
    const canAccess = newLessonCount <= FREE_LIMIT;

    // Track feature usage
    await supabase
      .from('feature_usage')
      .insert({
        user_id: userId || null,
        feature_name: 'lesson_generation',
        feature_category: 'generation',
        action: canAccess ? 'completed' : 'blocked',
        metadata: {
          lessonCount: newLessonCount,
          remainingLessons,
          lessonData: lessonData || {}
        },
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash
      });

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        event_name: canAccess ? 'lesson_generated' : 'limit_reached',
        event_category: 'freemium',
        event_properties: {
          lessonCount: newLessonCount,
          remainingLessons,
          limitReached: !canAccess
        },
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash,
        user_agent: userAgent
      });

    return NextResponse.json({
      success: true,
      lessonCount: newLessonCount,
      remainingLessons,
      canAccess,
      subscriptionStatus: 'free',
      resetDate: getNextMonthStart().toISOString(),
      userId
    });

  } catch (error) {
    console.error('Usage increment failed:', error);
    return NextResponse.json(
      { 
        error: 'Usage tracking failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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