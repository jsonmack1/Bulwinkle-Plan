import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '../../../../lib/supabase';

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
    const body: IncrementUsageRequest = await request.json();
    const { userId, fingerprintHash, sessionId, userAgent, lessonData, timestamp } = body;

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
    const currentYear = new Date().getFullYear();

    // Check if user is premium first (unlimited access)
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
          // Premium users have unlimited access - still track for analytics but don't limit
          await trackPremiumUsage(userId, lessonData, fingerprintHash, ipHash, sessionId, userAgent);
          
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
    const FREE_LIMIT = 3;

    // Get existing usage - check all tracking methods to prevent circumvention
    const { data: usageRecords, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('month', currentMonth)
      .or(`user_id.eq.${userId || 'null'},fingerprint_hash.eq.${fingerprintHash},ip_hash.eq.${ipHash}`);

    if (fetchError) {
      console.error('Usage fetch error:', fetchError);
      throw fetchError;
    }

    // Calculate current usage from all tracking methods
    let currentUsage = 0;
    let existingRecord: any = null;

    if (usageRecords && usageRecords.length > 0) {
      // Take the maximum usage count from any tracking method
      currentUsage = Math.max(...usageRecords.map(record => record.lesson_count || 0));
      
      // Prefer user-specific record if available
      existingRecord = usageRecords.find(record => record.user_id === userId) || usageRecords[0];
    }

    // Check if user has already exceeded the limit
    if (currentUsage >= FREE_LIMIT) {
      // Track the blocked attempt
      await supabase
        .from('feature_usage')
        .insert({
          user_id: userId || null,
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
          user_id: userId || null,
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
          user_id: userId || existingRecord.user_id, // Update user_id if user just signed up
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
    if (newLessonCount === 2 && !userId) {
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
          shouldPromptAccount: newLessonCount === 2 && !userId
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
      shouldPromptAccount: newLessonCount >= 2 && !userId,
      isLastFreeLesson: newLessonCount === FREE_LIMIT,
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

// Helper function to track premium user usage (for analytics only)
async function trackPremiumUsage(
  userId: string, 
  lessonData: any, 
  fingerprintHash: string, 
  ipHash: string, 
  sessionId: string, 
  userAgent: string
) {
  try {
    // Track premium feature usage
    await supabase
      .from('feature_usage')
      .insert({
        user_id: userId,
        feature_name: 'lesson_generation',
        feature_category: 'generation',
        action: 'completed',
        metadata: {
          subscription: 'premium',
          unlimited: true,
          lessonData: lessonData || {}
        },
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash
      });

    // Track premium analytics
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        session_id: sessionId,
        event_name: 'premium_lesson_generated',
        event_category: 'premium_usage',
        event_properties: {
          subscription: 'premium'
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