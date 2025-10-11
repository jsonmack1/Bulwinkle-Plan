/**
 * Intelligent Mathematical Reasoning Service
 * Provides dynamic step-by-step solutions for any mathematical expression
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  console.log('🧮 Intelligent Math Solver endpoint called')
  
  try {
    const { prompt } = await request.json()
    
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
    }

    console.log('🔍 Processing mathematical reasoning request')
    
    // Set a longer timeout for Sonnet 4.5 mathematical reasoning
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for mathematical accuracy
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const solution = response.content[0]?.type === 'text' ? response.content[0].text : ''
    
    console.log('✅ Intelligent mathematical reasoning completed')
    
    return NextResponse.json({
      success: true,
      solution
    })

  } catch (error: unknown) {
    console.error('❌ Intelligent Math Solver error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate mathematical solution'
    }, { status: 500 })
  }
}