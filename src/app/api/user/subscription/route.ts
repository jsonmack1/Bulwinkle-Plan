import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Get current user's subscription status
 * GET /api/user/subscription?userId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user subscription data - SIMPLIFIED
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        subscription_status,
        current_plan,
        subscription_end_date,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      // If user doesn't exist, create a basic record
      if (userError?.code === 'PGRST116') {
        try {
          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .upsert({
              id: userId,
              email: `user-${userId}@temp.com`,
              name: `User ${userId.substring(0, 8)}`,
              subscription_status: 'free',
              current_plan: 'free',
              created_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select('id, email, name, subscription_status, current_plan, subscription_end_date, created_at')
            .single();
            
          if (createError) {
            return NextResponse.json(
              { error: 'Could not create user', details: createError.message },
              { status: 500 }
            );
          }
          userData = createdUser;
        } catch (err) {
          return NextResponse.json(
            { error: 'User creation failed' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'User not found', details: userError?.message },
          { status: 404 }
        );
      }
    }

    // SIMPLIFIED subscription calculation
    const now = new Date();
    const endDate = userData.subscription_end_date ? new Date(userData.subscription_end_date) : null;
    let isActive = false;
    let daysRemaining = null;
    
    // Simple logic: if there's an end date, check if it's in the future
    if (endDate) {
      isActive = endDate > now;
      daysRemaining = isActive ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    } else {
      // No end date, check status directly
      isActive = userData.subscription_status === 'premium';
    }

    // Calculate isPremium
    const isPremium = userData.subscription_status === 'premium' && isActive;

    // SIMPLIFIED response
    const response = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        createdAt: userData.created_at
      },
      subscription: {
        status: userData.subscription_status || 'free',
        plan: userData.current_plan || 'free',
        isActive,
        isPremium,
        endDate: userData.subscription_end_date,
        daysRemaining
      },
      usage: {
        lessonsGenerated: 0,
        remainingLessons: isPremium ? 999 : 3,
        isOverLimit: false
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update user subscription (for admin use)
 * PUT /api/user/subscription
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscriptionStatus, currentPlan, endDate, adminKey } = body;

    // Simple admin key validation (in production, use proper admin authentication)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userId || !subscriptionStatus) {
      return NextResponse.json(
        { error: 'User ID and subscription status are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_status: subscriptionStatus,
        current_plan: currentPlan || 'free',
        subscription_end_date: endDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the admin action
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'admin_subscription_update',
        event_data: {
          previousStatus: data.subscription_status,
          newStatus: subscriptionStatus,
          updatedBy: 'admin',
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      user: data
    });

  } catch (error) {
    console.error('Subscription update failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}