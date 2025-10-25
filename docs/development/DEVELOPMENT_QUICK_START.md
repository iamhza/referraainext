# 🚀 Development Quick Start Guide

## Overview

This guide will get you up and running with the Referra platform development workflow in 5 minutes.

## 🎯 Your Development System

You now have a **production-grade AI-assisted development system** with:

1. **Cursor Rules** (`.cursorrules`) - Guides AI on code standards, security, and best practices
2. **AI Dev Tasks** (`ai-dev-tasks/`) - Structured workflow for feature development
3. **Tasks Directory** (`tasks/`) - Stores all PRDs and task lists
4. **Quality Standards** - Enforced TypeScript, testing, and security requirements

## 🏃 Quick Start: Build Your First Feature

### Option 1: Using the AI Dev Tasks Workflow (Recommended for New Features)

1. **Create a PRD**
   ```
   Use @ai-dev-tasks/create-prd.md
   
   I want to add [describe your feature]
   
   Reference files:
   @src/app/relevant-file.tsx
   ```

2. **Generate Tasks**
   ```
   Now take @tasks/[your-prd].md and create tasks using @ai-dev-tasks/generate-tasks.md
   ```
   
   Wait for high-level tasks, then reply "Go" to generate sub-tasks.

3. **Execute Tasks**
   ```
   Please start on task 1.1 and use @ai-dev-tasks/process-task-list.md
   ```
   
   Review each sub-task and reply "yes" to continue to the next one.

### Option 2: Direct Development (For Small Changes)

1. **Make Changes**
   - Edit files directly
   - AI follows `.cursorrules` automatically

2. **Test**
   ```bash
   npm run dev          # Manual testing
   npm run test:e2e     # Run E2E tests
   ```

3. **Commit**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push
   ```

## 📚 Key Files to Know

### Configuration & Rules
- `.cursorrules` - **AI behavior rules** (security, code quality, patterns)
- `ai-dev-tasks/` - **Workflow templates** (PRD, tasks, process)
- `tasks/` - **Feature documentation** (PRDs and task lists)

### Platform Documentation
- `COMPLETE_PLATFORM_OVERVIEW.md` - Architecture and features
- `FINALIZED_USER_FLOWS.md` - User workflows
- `COMPREHENSIVE_QA_TESTING.md` - Testing standards

### Codebase Structure
```
src/
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── lib/                # Utilities and business logic
└── types/              # TypeScript definitions
```

## 🎨 Common Tasks

### Adding a New Page

```typescript
// src/app/case-manager/new-page/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function NewPage() {
  const supabase = createClient();
  
  // Fetch data (RLS handles security)
  const { data } = await supabase
    .from('your_table')
    .select('*');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">New Page</h1>
      {/* Your content */}
    </div>
  );
}
```

### Adding an API Route

```typescript
// src/app/api/resource/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query with RLS
    const { data, error } = await supabase
      .from('resource')
      .select('*');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Adding a Component

```typescript
// src/components/feature/ComponentName.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ComponentProps {
  // Props
}

export function ComponentName({}: ComponentProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);
    try {
      // Implementation
      toast.success('Success!');
    } catch (error) {
      toast.error('Failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleAction} disabled={loading}>
        {loading ? 'Processing...' : 'Action'}
      </Button>
    </div>
  );
}
```

### Creating a Database Migration

```bash
# Create migration file
npx supabase migration new add_feature_table
```

```sql
-- supabase/migrations/[timestamp]_add_feature_table.sql

-- Create table
CREATE TABLE public.feature_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.feature_table ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "org_members_all" ON public.feature_table
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_feature_table_org ON public.feature_table(organization_id)
  WHERE deleted_at IS NULL;
```

### Writing a Test

```typescript
// tests/feature/test-name.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should do something', async ({ page }) => {
    await page.goto('/feature-path');
    
    await page.click('[data-testid="action-button"]');
    
    await expect(page.locator('text=Expected result')).toBeVisible();
  });
});
```

## 🔒 Security Checklist (ALWAYS)

Before any feature is complete:

- [ ] ✅ Authentication check in API routes
- [ ] ✅ RLS policies on database tables
- [ ] ✅ Input validation with Zod
- [ ] ✅ Organization isolation verified
- [ ] ✅ No secrets in code (use env vars)
- [ ] ✅ Error messages don't leak sensitive data

## 🧪 Testing Checklist (ALWAYS)

Before marking any feature complete:

- [ ] ✅ Happy path works
- [ ] ✅ Validation errors show correctly
- [ ] ✅ Works on mobile
- [ ] ✅ Works for different user roles
- [ ] ✅ Loading states implemented
- [ ] ✅ Empty states implemented
- [ ] ✅ E2E tests passing

## 🎯 Development Commands

```bash
# Development
npm run dev                # Start dev server (http://localhost:3000)
npm run build             # Build for production
npm run start             # Start production server

# Code Quality
npm run lint              # Run ESLint
npm run type-check        # Check TypeScript
npm run format            # Format with Prettier (if configured)

# Testing
npm run test              # Run all tests
npm run test:e2e          # Run E2E tests
npx playwright test --ui  # Run tests in UI mode

# Database
npx supabase start        # Start local Supabase
npx supabase stop         # Stop local Supabase
npx supabase db reset     # Reset local database
npx supabase migration new [name]  # Create migration
```

## 🐛 Troubleshooting

### "Unauthorized" errors
- Check if user is logged in
- Verify RLS policies are correct
- Check organization_id is set correctly

### TypeScript errors
- Run `npm run type-check` to see all errors
- Check `.cursorrules` for type standards
- Don't use `any` - use proper types

### Tests failing
- Check environment variables
- Verify database migrations applied
- Check test data setup
- Review test output carefully

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript/ESLint errors

## 💡 Pro Tips

1. **Use the AI Dev Tasks workflow for anything complex** - It saves time and reduces bugs

2. **Reference existing code** - The AI knows your codebase patterns
   ```
   Create a similar component to @src/components/clients/ClientCard.tsx
   ```

3. **Ask for clarification** - Better to ask than implement wrong
   ```
   Before I implement this, I need clarification on:
   1. Should supervisors have access?
   2. What happens when...?
   ```

4. **Test as you go** - Don't wait until the end
   ```bash
   npm run dev  # Check in browser
   npm run test:e2e  # Run tests
   ```

5. **Commit frequently** - After each parent task or logical unit

6. **Review your own code** - Before marking complete, review what was changed

7. **Check mobile** - Many users are on phones
   ```
   Open DevTools → Toggle device toolbar (Cmd+Shift+M)
   ```

## 📖 Learning Path

### Day 1: Learn the System
1. ✅ Read this guide
2. ✅ Review `.cursorrules`
3. ✅ Browse `tasks/` for examples
4. ✅ Read `COMPLETE_PLATFORM_OVERVIEW.md`

### Day 2-3: Small Change
1. Pick a small bug fix or UI tweak
2. Make the change following `.cursorrules`
3. Test thoroughly
4. Commit and deploy

### Week 2: First Feature with PRD
1. Pick a small new feature
2. Create PRD using `@ai-dev-tasks/create-prd.md`
3. Generate tasks
4. Execute tasks one by one
5. Deploy to production

### Month 1: Mastery
1. Build multiple features using the workflow
2. Contribute improvements to `.cursorrules`
3. Help onboard new team members
4. Review others' PRDs and code

## 🎓 Key Concepts to Understand

### Multi-Tenancy
- Every table has `organization_id`
- RLS policies enforce isolation
- Users can only see their org's data

### User Roles
- `case_manager` - Creates referrals, manages clients
- `provider` - Receives referrals, responds
- `supervisor` - Oversees team operations
- `org_admin` - Manages organization settings

### Server Components vs Client Components
- Server Components (default) - Fetch data, no interactivity
- Client Components ('use client') - Hooks, event handlers, state

### RLS (Row Level Security)
- Database-level security
- Enforced by PostgreSQL
- Can't be bypassed by API bugs
- Critical for multi-tenancy

## 🚀 You're Ready!

You now have everything you need to build production-grade features for Referra.

**Next Steps:**
1. Choose what to build (bug fix, enhancement, or new feature)
2. Follow the appropriate workflow
3. Ask questions when stuck
4. Test thoroughly
5. Ship it! 🎉

**Remember:**
- Quality over speed
- Security is non-negotiable
- Test on mobile
- Ask when uncertain
- Follow `.cursorrules`

---

**Need help?** Ask the AI assistant:
```
I need help with [specific issue]

Context:
@relevant-file.tsx

What I've tried:
1. ...
2. ...
```

**Happy coding! 🚀**



