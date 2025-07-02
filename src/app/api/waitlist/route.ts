import { NextRequest, NextResponse } from 'next/server';
import { sendWaitlistNotification } from '@/lib/email';

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

    // Log the signup
    console.log('New waitlist signup:', email);

    // Send email notification to info@referraai.com
    const emailResult = await sendWaitlistNotification(email);
    
    if (!emailResult.success) {
      console.error('Failed to send notification email:', emailResult.error);
      // Don't fail the signup if email fails, just log it
    }

    // TODO: Add database integration here
    // Example: await db.waitlist.create({ data: { email, createdAt: new Date() } });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for joining our waitlist! We\'ll be in touch soon.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
} 