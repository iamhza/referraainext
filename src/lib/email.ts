/**
 * Email service using Resend
 * Handles all email communications for the application
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface InvitationEmailProps {
  email: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteLink: string;
}

interface WelcomeEmailProps {
  email: string;
  name: string;
  organizationName: string;
  role: string;
  loginLink: string;
}

export async function sendInvitationEmail({
  email,
  inviterName,
  organizationName,
  role,
  inviteLink
}: InvitationEmailProps) {
  try {
    const roleDisplayName = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const { data, error } = await resend.emails.send({
      from: 'invites@resend.dev', // Using Resend test domain for now
      to: email,
      subject: `You're invited to join ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join ${organizationName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #5a6fd8; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
            .role-badge { background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 You're Invited!</h1>
            <p>Join ${organizationName} as a <span class="role-badge">${roleDisplayName}</span></p>
          </div>
          
          <div class="content">
            <p>Hi there!</p>
            
            <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${roleDisplayName}</strong>.</p>
            
            <p>Click the button below to complete your registration and get started:</p>
            
            <div style="text-align: center;">
              <a href="${inviteLink}" class="button">Complete Registration</a>
            </div>
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Click the invitation link above</li>
              <li>Set up your password and profile</li>
              <li>Start collaborating with your team</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to your team administrator.</p>
            
            <p style="margin-top: 30px;">
              <small><strong>Security note:</strong> This invitation link will expire in 7 days for security reasons.</small>
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${inviterName} from ${organizationName}</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      return { success: false, error: error.message };
    }

    console.log('Invitation email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function sendWelcomeEmail({
  email,
  name,
  organizationName,
  role,
  loginLink
}: WelcomeEmailProps) {
  try {
    const roleDisplayName = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const { data, error } = await resend.emails.send({
      from: 'welcome@resend.dev', // Using Resend test domain
      to: email,
      subject: `Welcome to ${organizationName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${organizationName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #45a049; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 Welcome Aboard!</h1>
            <p>You're now part of ${organizationName}</p>
          </div>
          
          <div class="content">
            <p>Hi ${name}!</p>
            
            <p>Congratulations! Your account has been successfully created and you're now a <strong>${roleDisplayName}</strong> at <strong>${organizationName}</strong>.</p>
            
            <div style="text-align: center;">
              <a href="${loginLink}" class="button">Access Your Dashboard</a>
            </div>
            
            <p><strong>Getting Started:</strong></p>
            <ul>
              <li>Explore your dashboard and available features</li>
              <li>Complete your profile setup</li>
              <li>Connect with your team members</li>
              <li>Review any assigned tasks or clients</li>
            </ul>
            
            <p>If you need any assistance getting started, don't hesitate to reach out to your team administrator.</p>
          </div>
          
          <div class="footer">
            <p>Welcome to the team! We're excited to have you aboard.</p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'security@resend.dev', // Using Resend test domain
      to: email,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff9800 0%, #e68900 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          
          <div class="content">
            <p>We received a request to reset your password.</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p><strong>Security reminders:</strong></p>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
