import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // For now, we'll just log the email
    // In production, you would integrate with an email service like:
    // - Mailchimp
    // - SendGrid
    // - ConvertKit
    // - Or send directly to jason@jmackcreative.com via SMTP
    
    console.log(`Newsletter signup: ${email}`);
    console.log(`Send notification to: jason@jmackcreative.com`);
    
    // You can add email service integration here
    // Example with a simple email notification:
    /*
    const emailBody = `
      New newsletter signup!
      
      Email: ${email}
      Date: ${new Date().toISOString()}
      Source: Lesson Plan Builder
    `;
    
    // Send email to jason@jmackcreative.com
    await sendEmail({
      to: 'jason@jmackcreative.com',
      subject: 'New Newsletter Signup - Lesson Plan Builder',
      body: emailBody
    });
    */

    return NextResponse.json(
      { 
        message: 'Successfully subscribed to newsletter',
        email: email 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}