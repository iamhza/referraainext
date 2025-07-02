import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Log the signup (this will work without email setup)
    console.log('🧪 TEST: New waitlist signup:', email);
    console.log('📧 Would send notification to: info@referraai.com');
    console.log('📅 Timestamp:', new Date().toLocaleString());

    // Check if email credentials are configured
    const hasEmailConfig = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
    
    if (!hasEmailConfig) {
      console.log('⚠️  Email notifications not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local');
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Test successful! Check the console for details.',
        emailConfigured: hasEmailConfig,
        userEmail: email,
        notificationEmail: 'info@referraai.com'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test waitlist signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
} 