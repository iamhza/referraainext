# 🚀 AI Development Workflow for Referra Platform

## Overview

This document outlines the production-grade development workflow for the Referra referral management platform. This structured approach ensures high-quality feature development, proper testing, and systematic implementation.

## System Architecture Context

**Referra Platform Stack:**
- Next.js 14+ (App Router)
- TypeScript
- Supabase (Database & Authentication)
- Tailwind CSS + shadcn/ui components
- React Server Components
- Server Actions for mutations

**Key User Roles:**
- Case Managers: Create and manage client referrals
- Providers: Receive and respond to referrals
- Supervisors: Oversee organizational operations
- Organization Admins: Manage users and settings

**Core Features:**
- Client management
- Referral workflow (creation, tracking, status updates)
- Provider directory and connections
- Real-time updates and notifications
- Document management
- Secure messaging

---

## 🎯 Three-Phase Development Workflow

### Phase 1: Create Product Requirements Document (PRD)

**When to Use:**
- Adding any new feature or functionality
- Modifying existing features significantly
- Building new user workflows
- Integrating third-party services

**Process:**

1. **Initiate PRD Creation:**
   ```
   Use @ai-dev-tasks/create-prd.md
   
   Feature: [Describe your feature]
   
   Context files (if relevant):
   @src/app/case-manager/page.tsx
   @src/components/referrals/ReferralPanel.tsx
   @src/lib/supabase/client.ts
   ```

2. **Answer Clarifying Questions:**
   The AI will ask about:
   - User stories and personas (Case Manager, Provider, etc.)
   - Functional requirements
   - Data models and API needs
   - UI/UX considerations
   - Integration points with existing features
   - Security and permissions
   - Success metrics

3. **Review Generated PRD:**
   The PRD will be saved as `/tasks/[n]-prd-[feature-name].md`
   
   Review for:
   - ✅ Alignment with platform goals
   - ✅ Security considerations (RLS policies, authentication)
   - ✅ Mobile responsiveness requirements
   - ✅ Real-time data considerations
   - ✅ Multi-tenant isolation
   - ✅ Performance implications

---

### Phase 2: Generate Task List

**Process:**

1. **Generate Tasks from PRD:**
   ```
   Now take @tasks/[n]-prd-[feature-name].md and create tasks using @ai-dev-tasks/generate-tasks.md
   ```

2. **Review High-Level Tasks:**
   - AI will generate 4-6 parent tasks
   - Review for logical flow and dependencies
   - Confirm alignment with existing architecture patterns

3. **Approve Sub-Task Generation:**
   - Reply with "Go" when parent tasks look good
   - AI will break down into detailed sub-tasks
   - Task list saved as `/tasks/tasks-[n]-prd-[feature-name].md`

**Task List Structure:**
```markdown
## Relevant Files
- `src/app/api/[endpoint]/route.ts` - API route
- `src/components/[feature]/ComponentName.tsx` - UI component
- `src/lib/[utility].ts` - Business logic

## Tasks
- [ ] 1.0 Database Schema & Migrations
  - [ ] 1.1 Create Supabase migration
  - [ ] 1.2 Define TypeScript types
  - [ ] 1.3 Set up RLS policies
- [ ] 2.0 API Routes & Server Actions
  - [ ] 2.1 Create API route handler
  - [ ] 2.2 Implement server actions
  - [ ] 2.3 Add error handling
- [ ] 3.0 UI Components
  - [ ] 3.1 Create base component
  - [ ] 3.2 Add form validation
  - [ ] 3.3 Implement loading states
- [ ] 4.0 Integration & Testing
  - [ ] 4.1 E2E tests with Playwright
  - [ ] 4.2 Test user permissions
  - [ ] 4.3 Verify responsive design
```

---

### Phase 3: Execute Tasks (Iterative Implementation)

**Process:**

1. **Start First Task:**
   ```
   Please start on task 1.1 and use @ai-dev-tasks/process-task-list.md
   ```

2. **Review Each Sub-Task:**
   - AI implements one sub-task at a time
   - Review the changes thoroughly
   - Reply "yes" or "y" to approve and continue
   - Provide feedback if changes needed

3. **Automatic Progress Tracking:**
   - Sub-tasks marked `[x]` when completed
   - When all sub-tasks complete:
     - Tests run automatically
     - Changes staged with `git add`
     - Committed with descriptive message
   - Parent task marked complete

4. **Commit Format:**
   ```bash
   git commit -m "feat: add client document upload" \
     -m "- Implements secure file storage in Supabase" \
     -m "- Adds client-side upload UI with progress" \
     -m "- Includes RLS policies for document access" \
     -m "Task 2.0 - Document Management PRD"
   ```

---

## 🎨 Platform-Specific Guidelines

### Database Changes (Supabase)

**Always Consider:**
- Row Level Security (RLS) policies for multi-tenant isolation
- Proper foreign key relationships
- Indexes for performance
- Soft deletes (`deleted_at` timestamp)
- Audit columns (`created_at`, `updated_at`, `created_by`)

**Migration Template:**
```sql
-- Migration: [descriptive-name]
-- Description: [what this changes]

-- Create table
CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org data"
  ON public.table_name FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ));
```

### API Routes

**Structure:**
```typescript
// src/app/api/[resource]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    // Query with RLS
    const { data, error } = await supabase
      .from('resource')
      .select('*')
      .eq('organization_id', profile?.organization_id);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### React Components

**Best Practices:**
- Use Server Components by default
- Add `'use client'` only when needed (hooks, event handlers)
- Implement proper loading and error states
- Follow mobile-first responsive design
- Use shadcn/ui components for consistency
- Implement optimistic updates for better UX

**Component Template:**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ComponentProps {
  // Define props
}

export function ComponentName({ }: ComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      // Implementation
      toast.success('Action completed');
    } catch (error) {
      toast.error('Action failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Component UI */}
      <Button 
        onClick={handleAction} 
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Action'}
      </Button>
    </div>
  );
}
```

### Testing Requirements

**E2E Tests (Playwright):**
```typescript
// tests/[feature].spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login as appropriate user role
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should perform expected action', async ({ page }) => {
    await page.goto('/feature-path');
    
    // Test implementation
    await page.click('[data-testid="action-button"]');
    
    // Assertions
    await expect(page.locator('[data-testid="result"]'))
      .toContainText('Expected result');
  });
});
```

**Test Coverage Requirements:**
- ✅ Happy path user flows
- ✅ Permission checks (role-based access)
- ✅ Error handling and validation
- ✅ Mobile responsiveness
- ✅ Edge cases and boundary conditions

---

## 🔒 Security Checklist

For every feature, verify:

- [ ] **Authentication**: User must be logged in
- [ ] **Authorization**: User has appropriate role/permissions
- [ ] **RLS Policies**: Database enforces multi-tenant isolation
- [ ] **Input Validation**: All user inputs validated and sanitized
- [ ] **CSRF Protection**: Forms use proper tokens
- [ ] **SQL Injection**: Using parameterized queries (Supabase handles this)
- [ ] **XSS Protection**: No direct HTML injection
- [ ] **Sensitive Data**: PII properly encrypted and access logged
- [ ] **Rate Limiting**: API endpoints protected from abuse

---

## 📊 Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Proper type definitions for all functions
- Use type inference where appropriate

### Code Organization
```
src/
├── app/                          # Next.js app router
│   ├── api/                     # API routes
│   ├── (auth)/                  # Auth-required pages
│   ├── case-manager/            # Case manager dashboard
│   └── provider/                # Provider dashboard
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   ├── dashboard/               # Dashboard-specific
│   ├── referrals/              # Referral management
│   └── clients/                # Client management
├── lib/                         # Utilities and helpers
│   ├── supabase/               # Supabase clients
│   ├── utils/                  # Helper functions
│   └── hooks/                  # Custom React hooks
└── types/                       # TypeScript type definitions
```

### Naming Conventions
- **Files**: `kebab-case.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`
- **Database tables**: `snake_case`

---

## 🚀 Pre-Launch Checklist

Before marking any feature as complete:

### Functionality
- [ ] All acceptance criteria from PRD met
- [ ] Tested across different user roles
- [ ] Works on mobile, tablet, and desktop
- [ ] Loading states implemented
- [ ] Error messages user-friendly
- [ ] Empty states designed

### Performance
- [ ] Database queries optimized (indexes, joins)
- [ ] No N+1 query problems
- [ ] Images optimized
- [ ] Bundle size acceptable
- [ ] Core Web Vitals pass

### Security
- [ ] All items from security checklist verified
- [ ] Penetration testing completed
- [ ] No sensitive data in logs

### Documentation
- [ ] Code comments for complex logic
- [ ] README updated if needed
- [ ] API endpoints documented
- [ ] User guide updated

### Testing
- [ ] E2E tests passing
- [ ] Manual QA completed
- [ ] Accessibility tested (WCAG 2.1 AA)
- [ ] Cross-browser testing done

---

## 🎯 Example Workflow: Adding a New Feature

Let's say you want to add "Client Notes with @mentions":

### 1. Create PRD
```
Use @ai-dev-tasks/create-prd.md

I want to add a notes feature for clients where case managers can add notes 
and @mention other team members to notify them. Notes should be searchable 
and filterable by date/author.

Reference these files:
@src/app/case-manager/clients/[id]/page.tsx
@src/components/clients/ClientDetailsPanel.tsx
@src/lib/supabase/client.ts
```

AI will ask clarifying questions:
- Who can view/edit notes?
- What notification system to use?
- Should notes support rich text?
- Privacy/security requirements?

Result: `/tasks/0015-prd-client-notes-mentions.md`

### 2. Generate Tasks
```
Now take @tasks/0015-prd-client-notes-mentions.md and create tasks 
using @ai-dev-tasks/generate-tasks.md
```

AI generates high-level tasks:
- 1.0 Database schema for notes
- 2.0 Mention detection and user lookup
- 3.0 API routes for CRUD operations
- 4.0 UI components (note editor, list)
- 5.0 Notification system integration

Reply: "Go"

AI generates detailed sub-tasks
Result: `/tasks/tasks-0015-prd-client-notes-mentions.md`

### 3. Execute Tasks
```
Please start on task 1.1 and use @ai-dev-tasks/process-task-list.md
```

AI implements task 1.1 (Create notes table migration)
Review the SQL, reply: "yes"

AI implements task 1.2 (Define TypeScript types)
Review the types, reply: "yes"

... continue through all tasks ...

When parent task 1.0 completes:
- Tests run automatically
- Changes committed with descriptive message

Continue until all tasks complete!

---

## 🔧 Troubleshooting

### AI Gets Stuck
- Break down the current task into smaller pieces
- Provide more context about existing code patterns
- Reference similar implementations in the codebase

### Tests Fail
- Review test output carefully
- Check for environment variable issues
- Verify database state (migrations applied?)
- Ensure test data is properly seeded

### Task List Needs Adjustment
- It's okay to add tasks mid-flow
- Mark irrelevant tasks as cancelled
- Split complex tasks into multiple sub-tasks

### Merge Conflicts
- Commit frequently (after each parent task)
- Pull from main regularly
- Keep PRD scope focused and manageable

---

## 📚 Additional Resources

### Internal Documentation
- `COMPLETE_PLATFORM_OVERVIEW.md` - Platform architecture
- `FINALIZED_USER_FLOWS.md` - User workflows
- `COMPREHENSIVE_QA_TESTING.md` - Testing standards
- `PRODUCTION_UPGRADE_COMPLETE.md` - Deployment guide

### External Resources
- [Next.js App Router Docs](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Playwright Testing](https://playwright.dev/)

---

## 💡 Best Practices

### Do's ✅
- ✅ Always start with a PRD for significant features
- ✅ Review each sub-task before approving
- ✅ Test on multiple devices and browsers
- ✅ Keep commits atomic and well-described
- ✅ Ask clarifying questions if requirements unclear
- ✅ Reference existing code patterns
- ✅ Consider edge cases and error states
- ✅ Document complex business logic

### Don'ts ❌
- ❌ Skip the PRD for "small" features (they grow!)
- ❌ Approve tasks without reviewing the code
- ❌ Merge without testing
- ❌ Ignore linting or TypeScript errors
- ❌ Hard-code values that should be configurable
- ❌ Forget mobile responsiveness
- ❌ Leave TODO comments without tickets
- ❌ Deploy without QA approval

---

## 🎓 Training for Team Members

### For New Developers
1. Read this guide thoroughly
2. Review existing PRDs in `/tasks/`
3. Pick a small feature to implement with AI assistance
4. Pair program with senior engineer for first PRD

### For Product Managers
1. Understand PRD structure and requirements
2. Learn to write clear user stories
3. Define acceptance criteria precisely
4. Review generated PRDs before task creation

### For QA Engineers
1. Review PRDs to create test plans
2. Verify all acceptance criteria in PRDs
3. Test each feature against PRD requirements
4. Document any deviations or issues

---

## 🚀 Next Steps

1. **Review Existing Features**: Look at `/tasks/` for examples
2. **Identify Next Feature**: What's the next priority for Referra?
3. **Create Your First PRD**: Use the workflow above
4. **Iterate and Improve**: Refine the process for your team

---

**Remember**: This structured approach might feel slower initially, but it:
- Reduces bugs and technical debt
- Improves code quality and consistency  
- Makes features easier to maintain
- Provides clear documentation
- Enables efficient collaboration
- Results in production-ready code

**Quality over speed leads to faster overall delivery** 🎯



