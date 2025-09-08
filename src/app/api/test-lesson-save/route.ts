// Debug API endpoint to test lesson saving to database
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing lesson save to database...')

    // Test 1: Check Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('lessons')
      .select('count(*)', { count: 'exact', head: true })

    if (testError) {
      console.error('❌ Supabase connection failed:', testError)
      return NextResponse.json({
        success: false,
        step: 'supabase_connection',
        error: testError.message,
        details: testError
      }, { status: 500 })
    }

    console.log('✅ Supabase connection successful. Current lesson count:', testData)

    // Test 2: Check if we can insert a simple lesson
    const testLesson = {
      title: 'Test Lesson - ' + new Date().toISOString(),
      subject: 'Math',
      grade_level: '5th Grade',
      topic: 'Addition',
      activity_type: 'Worksheet',
      duration: 30,
      content: 'This is a test lesson content to verify database insertion works.',
      user_id: null, // Test with no user first
      user_email: 'test@example.com',
      preview_text: 'This is a test lesson...',
      tags: ['Math', 'Elementary', 'Addition'],
      mode: 'teacher',
      rating: 0,
      use_count: 1,
      is_favorite: false,
      template_use_count: 0,
      success_score: 0
    }

    console.log('📝 Attempting to insert test lesson:', testLesson.title)

    const { data: insertedLesson, error: insertError } = await supabase
      .from('lessons')
      .insert(testLesson)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to insert test lesson:', insertError)
      return NextResponse.json({
        success: false,
        step: 'lesson_insertion',
        error: insertError.message,
        details: insertError,
        attempted_data: testLesson
      }, { status: 500 })
    }

    console.log('✅ Successfully inserted test lesson:', insertedLesson.id)

    // Test 3: Verify the lesson was actually saved
    const { data: verifyData, error: verifyError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', insertedLesson.id)
      .single()

    if (verifyError || !verifyData) {
      return NextResponse.json({
        success: false,
        step: 'lesson_verification',
        error: 'Could not verify lesson was saved',
        details: verifyError
      }, { status: 500 })
    }

    // Test 4: Clean up test lesson
    await supabase
      .from('lessons')
      .delete()
      .eq('id', insertedLesson.id)

    return NextResponse.json({
      success: true,
      message: 'All database tests passed!',
      test_results: {
        supabase_connection: 'SUCCESS',
        lesson_insertion: 'SUCCESS',
        lesson_verification: 'SUCCESS',
        cleanup: 'SUCCESS'
      },
      inserted_lesson_id: insertedLesson.id,
      verified_data: verifyData
    })

  } catch (error) {
    console.error('🔥 Test failed with exception:', error)
    return NextResponse.json({
      success: false,
      step: 'exception_caught',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Simple GET version of the test
  return NextResponse.json({
    message: 'Use POST to run lesson save tests',
    endpoint: '/api/test-lesson-save',
    purpose: 'Debug lesson database insertion issues'
  })
}