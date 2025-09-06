import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../lib/auth';

interface DemoAccountRequest {
  action: 'create' | 'login' | 'reset';
  type?: 'free' | 'premium';
}

interface DemoAccountResponse {
  success: boolean;
  user?: any;
  message?: string;
  error?: string;
  credentials?: {
    email: string;
    password: string;
  };
}

/**
 * Development endpoint to manage demo accounts
 * POST /api/dev/demo-account
 */
export async function POST(request: NextRequest) {
  // Only allow in development/staging environments
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_ACCOUNTS !== 'true') {
    return NextResponse.json({
      success: false,
      error: 'Demo accounts are not available in production'
    } as DemoAccountResponse, { status: 403 });
  }

  try {
    const body: DemoAccountRequest = await request.json();
    const { action, type = 'premium' } = body;

    console.log('🧪 Demo account API called:', { action, type });

    switch (action) {
      case 'create':
        return await createDemoAccount(type);
      
      case 'login':
        return await loginDemoAccount();
      
      case 'reset':
        return await resetDemoAccounts();
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: create, login, or reset'
        } as DemoAccountResponse, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Demo account API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process demo account request'
    } as DemoAccountResponse, { status: 500 });
  }
}

async function createDemoAccount(type: 'free' | 'premium'): Promise<NextResponse<DemoAccountResponse>> {
  try {
    const timestamp = Date.now();
    const email = `demo-${type}-${timestamp}@peabody-dev.com`;
    const password = 'demo123456';
    const name = `Demo ${type === 'premium' ? 'Pro' : 'Free'} Teacher`;

    // Create the demo account using authService
    const user = await authService.signup({
      email,
      password,
      name
    });

    // If premium demo account, upgrade it
    if (type === 'premium') {
      authService.upgradeToPremium(user.id);
      
      // Update user object with premium status
      user.subscription = {
        plan: 'premium',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    console.log('✅ Created demo account:', { email, type, userId: user.id });

    return NextResponse.json({
      success: true,
      user,
      message: `${type === 'premium' ? 'Premium' : 'Free'} demo account created successfully`,
      credentials: {
        email,
        password
      }
    } as DemoAccountResponse);

  } catch (error) {
    console.error('❌ Failed to create demo account:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create demo account'
    } as DemoAccountResponse, { status: 500 });
  }
}

async function loginDemoAccount(): Promise<NextResponse<DemoAccountResponse>> {
  try {
    // Try to log in with the predefined demo account
    const demoCredentials = {
      email: 'demo@lessonbuilder.com',
      password: 'demo123'
    };

    let user;
    
    try {
      user = await authService.login(demoCredentials);
    } catch (loginError) {
      // If demo account doesn't exist, create it
      console.log('🧪 Demo account not found, creating it...');
      user = await authService.createDemoAccount();
    }

    console.log('✅ Logged into demo account:', { email: user.email, userId: user.id });

    return NextResponse.json({
      success: true,
      user,
      message: 'Successfully logged into demo account',
      credentials: demoCredentials
    } as DemoAccountResponse);

  } catch (error) {
    console.error('❌ Failed to login to demo account:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to login to demo account'
    } as DemoAccountResponse, { status: 500 });
  }
}

async function resetDemoAccounts(): Promise<NextResponse<DemoAccountResponse>> {
  try {
    // Clear all authentication data
    authService.clearAllData();

    console.log('✅ Reset all demo accounts and authentication data');

    return NextResponse.json({
      success: true,
      message: 'All demo accounts and authentication data cleared'
    } as DemoAccountResponse);

  } catch (error) {
    console.error('❌ Failed to reset demo accounts:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset demo accounts'
    } as DemoAccountResponse, { status: 500 });
  }
}

/**
 * Get demo account status and available actions
 * GET /api/dev/demo-account
 */
export async function GET(request: NextRequest) {
  // Only allow in development/staging environments
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_ACCOUNTS !== 'true') {
    return NextResponse.json({
      error: 'Demo accounts are not available in production'
    }, { status: 403 });
  }

  try {
    const currentUser = authService.getCurrentUser();
    
    return NextResponse.json({
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        subscription: currentUser.subscription
      } : null,
      availableActions: ['create', 'login', 'reset'],
      demoAccountTypes: ['free', 'premium'],
      environment: process.env.NODE_ENV || 'development',
      message: 'Demo account management available'
    });

  } catch (error) {
    console.error('❌ Failed to get demo account status:', error);
    
    return NextResponse.json({
      error: 'Failed to get demo account status'
    }, { status: 500 });
  }
}