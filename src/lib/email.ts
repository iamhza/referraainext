import nodemailer from 'nodemailer';

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
  },
});

export async function sendWaitlistNotification(userEmail: string) {
  try {
    // 1. Send notification to admin
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'info@referraai.com',
      subject: `🎉 New Waitlist Signup - ${userEmail}`,
      html: `
        <div>
          <h2>New Waitlist Signup!</h2>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    // 2. Send beautiful confirmation to user
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: "🎉 You're officially on the Referra Waitlist – Welcome to the future of referrals!",
      html: `
        <div style="font-family: 'Satoshi', 'Inter', 'SF Pro', 'Segoe UI', Arial, sans-serif; background: #F8FAFC; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 40px auto; border-radius: 18px; box-shadow: 0 2px 16px rgba(0,0,0,0.04); border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #0066FF 0%, #0055DD 100%); padding: 28px 0 18px 0; text-align: center;">
              <img src="https://i.imgur.com/Fq7anoB.png" alt="Referra Logo" style="height: 48px; margin-bottom: 10px;" />
              <div style="margin-top: 8px; color: #eaf2ff; font-size: 1.1rem; font-weight: 500; letter-spacing: 0.5px;">Welcome to Your Referral Advantage.</div>
            </div>
            <div style="background: #fff; padding: 36px 32px 32px 32px; border-radius: 0 0 18px 18px;">
              <h2 style="margin: 0 0 18px 0; color: #0066FF; font-size: 1.4rem; font-weight: 700;">You're in. Let's build smarter referrals, together.</h2>
              <p style="color: #222; font-size: 1.08rem; margin-bottom: 22px;">Thank you for joining the Referra waitlist! Referra is the new way for <strong>case managers</strong> and <strong>providers</strong> to connect—faster, smarter, and with less friction.</p>
              <p style="color: #222; font-size: 1.08rem; margin-bottom: 22px;">Our platform uses intelligent matching to help case managers find the right providers in seconds, and helps providers grow their network with high-quality, pre-vetted referrals. No more endless calls, missed connections, or wasted time—just seamless, secure, and transparent referrals for everyone.</p>
              <p style="color: #222; font-size: 1.08rem; margin-bottom: 22px;">Whether you're a provider or a case manager, Referra is designed to make your work easier and your impact bigger. We're excited to build this with you.<br>In the meantime, explore our story or reply with questions—real humans are here.</p>
              <div style="margin-bottom: 28px; margin-top: 32px; text-align: center;">
                <a href="https://referraai.com" style="display: inline-block; background: linear-gradient(90deg, #0066FF 0%, #0055DD 100%); color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 1.08rem; text-align: center; margin-right: 8px;">🔵 Visit Our Website</a>
                <a href="mailto:info@referraai.com?subject=Referra%20Waitlist%20Feedback" style="display: inline-block; background: #F4F8FF; color: #0066FF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 1.08rem; text-align: center; border: 1px solid #e5e7eb;">💬 Give Feedback Early</a>
              </div>
              <div style="color: #888; font-size: 0.98rem; margin-top: 18px; text-align: center;">
                info@referraai.com
              </div>
            </div>
            <div style="background: #F4F8FF; text-align: center; padding: 16px 0; color: #888; font-size: 0.95rem; border-radius: 0 0 18px 18px;">
              © 2025 Referra. All rights reserved.
            </div>
          </div>
        </div>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send waitlist emails:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 