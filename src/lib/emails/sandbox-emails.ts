/**
 * Sandbox Email Notifications
 * 
 * Email templates and sending functions for sandbox lifecycle events.
 * Uses Resend for email delivery.
 */

// TODO: Uncomment when ready to send emails
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string;
  name: string;
  tier: 'micro' | 'mid' | 'enterprise';
  daysRemaining?: number;
  sandboxUrl?: string;
}

// ============================================================================
// WELCOME EMAIL (Sent immediately after sandbox creation)
// ============================================================================

export async function sendWelcomeEmail(params: EmailParams): Promise<boolean> {
  const { to, name, tier, sandboxUrl } = params;
  
  const tierDays = tier === 'micro' ? 7 : tier === 'mid' ? 14 : 30;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .feature { padding: 15px; background: white; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Referra!</h1>
          <p>Your demo is ready to explore</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>Your <strong>${tier}</strong> organization demo is ready! We've populated it with realistic data so you can experience Referra just as you would in production.</p>
          
          <a href="${sandboxUrl || 'https://referra.com'}" class="button">Start Exploring →</a>
          
          <h3>What to try first:</h3>
          <div class="feature">
            📋 <strong>View Your Dashboard</strong><br>
            See your client board with realistic cases
          </div>
          <div class="feature">
            ✨ <strong>Take the Guided Tour</strong><br>
            10-minute walkthrough of key features
          </div>
          <div class="feature">
            🎮 <strong>Try Challenges</strong><br>
            Test your skills with interactive scenarios
          </div>
          
          <p><strong>You have ${tierDays} days</strong> to explore the demo. We'll send you reminders along the way.</p>
          
          <p>Questions? Just reply to this email.</p>
          
          <p>Best,<br>The Referra Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    console.log(`📧 Would send welcome email to ${to}`);
    
    // TODO: Uncomment when ready
    // await resend.emails.send({
    //   from: 'Referra <hello@referra.com>',
    //   to,
    //   subject: '🎉 Your Referra Demo is Ready!',
    //   html: htmlContent,
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

// ============================================================================
// MID-DEMO NUDGE (Sent at halfway point)
// ============================================================================

export async function sendNudgeEmail(params: EmailParams): Promise<boolean> {
  const { to, name, tier, daysRemaining } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>How's your demo going?</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>You're halfway through your Referra demo! We wanted to check in and see if you have any questions.</p>
          
          <p><strong>${daysRemaining} days remaining</strong> to explore all features.</p>
          
          <h3>Haven't tried yet?</h3>
          <ul>
            <li>Challenge scenarios (test your skills!)</li>
            <li>Workspace messaging (see provider communication)</li>
            <li>Analytics dashboard (track outcomes)</li>
          </ul>
          
          <a href="https://referra.com" class="button">Continue Demo →</a>
          
          <p>Want a live walkthrough? <a href="https://calendly.com/referra">Book 15 minutes</a> with our team.</p>
          
          <p>Best,<br>The Referra Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    console.log(`📧 Would send nudge email to ${to}`);
    
    // TODO: Uncomment when ready
    // await resend.emails.send({
    //   from: 'Referra <hello@referra.com>',
    //   to,
    //   subject: `${daysRemaining} days left in your demo - Questions?`,
    //   html: htmlContent,
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending nudge email:', error);
    return false;
  }
}

// ============================================================================
// EXPIRATION WARNING (2 days before)
// ============================================================================

export async function sendExpirationWarning(params: EmailParams): Promise<boolean> {
  const { to, name, daysRemaining } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Your demo expires in ${daysRemaining} days</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          
          <div class="warning">
            <strong>Your Referra demo expires soon.</strong> After that, you'll only be able to view (not edit) the demo.
          </div>
          
          <p>Love what you've seen? Let's make it real:</p>
          
          <a href="https://referra.com" class="button">Start Real Account →</a>
          
          <h3>What happens next:</h3>
          <ul>
            <li>✨ Fresh production environment (no demo data)</li>
            <li>🎓 Your demo stays available for training</li>
            <li>🚀 Same login, real platform</li>
            <li>📞 We'll help you get started</li>
          </ul>
          
          <p>Questions? Reply to this email or <a href="https://calendly.com/referra">schedule a call</a>.</p>
          
          <p>Best,<br>The Referra Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    console.log(`📧 Would send expiration warning to ${to}`);
    
    // TODO: Uncomment when ready
    // await resend.emails.send({
    //   from: 'Referra <hello@referra.com>',
    //   to,
    //   subject: `⏰ Demo expires in ${daysRemaining} days - Ready to go live?`,
    //   html: htmlContent,
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending expiration warning:', error);
    return false;
  }
}

// ============================================================================
// POST-EXPIRATION (Day after expiration)
// ============================================================================

export async function sendPostExpiration(params: EmailParams): Promise<boolean> {
  const { to, name } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 14px 28px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .social-proof { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your demo has ended</h1>
          <p>Ready to go live with Referra?</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>Your Referra demo period has ended. We hope you got a good feel for how the platform works!</p>
          
          <div class="social-proof">
            <em>"Referra helped us cut referral coordination time by 60% and improve our placement success rate to 94%."</em>
            <br><strong>– TruWell Minnesota</strong>
          </div>
          
          <p>Ready to make this real for your organization?</p>
          
          <a href="https://referra.com" class="button">Start Your Real Account →</a>
          
          <p><strong>What you get:</strong></p>
          <ul>
            <li>✨ Production-ready platform</li>
            <li>📞 Personalized onboarding</li>
            <li>🎓 Team training included</li>
            <li>💯 HIPAA-compliant from day one</li>
          </ul>
          
          <p>Or, if you have questions, just reply to this email. We're here to help!</p>
          
          <p>Best,<br>The Referra Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    console.log(`📧 Would send post-expiration email to ${to}`);
    
    // TODO: Uncomment when ready
    // await resend.emails.send({
    //   from: 'Referra <hello@referra.com>',
    //   to,
    //   subject: 'Ready to go live with Referra?',
    //   html: htmlContent,
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending post-expiration email:', error);
    return false;
  }
}

