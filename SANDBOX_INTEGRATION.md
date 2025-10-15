# 🚀 Sandbox Integration - 5-Minute Setup

## Step 1: Initialize Database (1 min)

```bash
npx tsx src/lib/sandbox/init-collections.ts
```

You should see:
```
✅ Created collection: sandbox_organizations
✅ Created collection: sandbox_tour_progress
✅ Created collection: sandbox_challenges
✅ Created collection: sandbox_analytics_events
```

---

## Step 2: Update Root Layout (2 min)

**File:** `src/app/layout.tsx`

```tsx
import { ConversionModalProvider } from '@/components/sandbox/ConversionModalProvider';
import { SandboxBanner } from '@/components/sandbox/SandboxBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {/* Add these two lines */}
          <ConversionModalProvider>
            <SandboxBanner />
            
            {children}
            
          </ConversionModalProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Step 3: Add Signup Button to Landing Page (1 min)

**Example:**

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

<Link href="/auth/sandbox-signup">
  <Button size="lg">
    Try Demo Now - Free
  </Button>
</Link>
```

---

## Step 4: Environment Variables (1 min)

Add to `.env.local`:

```env
# Existing vars (keep these)
MONGODB_URI=your_connection_string
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# New: Cron security (generate random string)
CRON_SECRET=your_random_string_here

# Optional: Email sending (can add later)
# RESEND_API_KEY=re_xxxxx
```

Generate CRON_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5: Test Locally (30 sec)

```bash
npm run dev
```

Visit: `http://localhost:3000/auth/sandbox-signup`

You should see the beautiful 3-step signup flow!

---

## Step 6: Deploy to Vercel

```bash
vercel --prod
```

Vercel automatically:
- Reads `vercel.json`
- Sets up cron job
- Runs daily expiration check

---

## ✅ That's It!

Your sandbox system is now live! Users can:
1. Sign up for demos
2. Explore your real platform with dummy data
3. Convert to production with BAA signing
4. You get sales intelligence automatically

---

## 🎯 Next Steps (Optional)

### Enable Email Sending
1. Get Resend API key: https://resend.com
2. Add to environment: `RESEND_API_KEY=re_xxxxx`
3. Uncomment email sending in `src/lib/emails/sandbox-emails.ts`

### View Analytics
Visit: `/admin/sandbox-intelligence`
- See hot leads
- Track conversion funnel
- Monitor expiring sandboxes

### Test Cron Job Locally
```bash
curl http://localhost:3000/api/cron/expire-sandboxes \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🐛 Troubleshooting

### "Collections not found"
Run: `npx tsx src/lib/sandbox/init-collections.ts`

### "Sandbox not creating"
Check MongoDB connection and ensure collections exist

### "Banner not showing"
Make sure you added ConversionModalProvider and SandboxBanner to layout

### "Cron not running"
- Check Vercel dashboard → Cron jobs
- Ensure CRON_SECRET is set in Vercel environment variables

---

## 📊 Monitor Performance

Check these metrics:
- Sandbox creation time (should be <5s)
- Conversion rate (target: 40%+)
- Hot leads count
- Tour completion rate

Access via: `/admin/sandbox-intelligence`

---

**Questions?** Check `SANDBOX_SYSTEM_COMPLETE.md` for full documentation.

**You're all set! 🎉**

