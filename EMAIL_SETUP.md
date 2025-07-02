# Email Notification Setup for Waitlist

This guide will help you set up email notifications to `info@referraai.com` whenever someone signs up for the waitlist.

## Prerequisites

1. A Gmail account that will be used to send the notifications
2. 2-factor authentication enabled on your Gmail account

## Setup Steps

### 1. Create Gmail App Password

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Under "Signing in to Google," select **App passwords**
4. Generate a new app password:
   - Select "Mail" as the app
   - Select "Other" as the device
   - Enter a name like "Referra Waitlist"
   - Click "Generate"
5. Copy the generated 16-character password

### 2. Set Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Gmail Configuration for Waitlist Notifications
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Important:** 
- Replace `your-email@gmail.com` with the Gmail address you want to send from
- Replace `your-16-character-app-password` with the app password you generated
- Never commit this file to version control

### 3. Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

### 4. Test the Setup

1. Start the development server: `npm run dev`
2. Go to your website and sign up for the waitlist
3. Check if you receive an email notification at `info@referraai.com`

## Email Template

The notification email includes:
- A beautiful HTML template with Referra branding
- The user's email address
- Timestamp of signup
- Link to the website
- Professional styling

## Troubleshooting

### Common Issues

1. **"Invalid login" error**: Make sure you're using an App Password, not your regular Gmail password
2. **"Less secure app access" error**: Enable 2-factor authentication and use App Passwords
3. **Emails not sending**: Check that your Gmail account allows SMTP access

### Security Notes

- Always use App Passwords, never your regular Gmail password
- Keep your `.env.local` file secure and never commit it to version control
- Consider using a dedicated Gmail account for sending notifications

## Production Deployment

When deploying to Vercel or other platforms:

1. Add the environment variables in your deployment platform's settings
2. Make sure the environment variables are named exactly as shown above
3. Test the email functionality after deployment

## Email Content

The notification email will be sent to `info@referraai.com` with:
- Subject: "🎉 New Waitlist Signup - Referra"
- HTML content with Referra branding
- User's email address and signup timestamp
- Professional styling and layout 