import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('🔧 Testing Supabase connection...');
    console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('🔧 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
    // Test basic connection
    const { data, error } = await supabase.from('usage_tracking').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase test error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connected successfully',
      tableExists: true 
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error 
    }, { status: 500 });
  }
}