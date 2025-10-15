# Task List: Interactive Sandbox Onboarding & Demo Environment

**PRD**: `/tasks/0002-prd-interactive-sandbox-onboarding.md`  
**Status**: Ready for Implementation  
**Estimated Duration**: 8 weeks

---

## Relevant Files

### New Files to Create
- `src/lib/sandbox/sandbox-manager.ts` - Core sandbox organization creation and management
- `src/lib/sandbox/dummy-data-seeder.ts` - Tier-based dummy data generation and seeding
- `src/lib/sandbox/sandbox-middleware.ts` - Query filtering and isolation enforcement
- `src/contexts/EnhancedTourContext.tsx` - Enhanced tour system (extends existing TourContext)
- `src/lib/tours/case-manager-tour.ts` - Case manager tour configuration
- `src/lib/tours/supervisor-tour.ts` - Supervisor tour configuration (NEW)
- `src/lib/tours/org-admin-tour.ts` - Org admin tour configuration (NEW)
- `src/components/sandbox/SandboxBanner.tsx` - Persistent sandbox indicator banner
- `src/components/sandbox/ConversionModal.tsx` - "Start Real Account" flow modal
- `src/components/sandbox/ChallengeCard.tsx` - Challenge scenario UI component
- `src/components/sandbox/ChallengeModal.tsx` - Challenge execution interface
- `src/lib/challenges/challenge-framework.ts` - Challenge system logic
- `src/lib/challenges/case-manager-challenges.ts` - Case manager challenge definitions
- `src/lib/challenges/supervisor-challenges.ts` - Supervisor challenge definitions
- `src/lib/challenges/org-admin-challenges.ts` - Org admin challenge definitions
- `src/lib/analytics/sandbox-tracker.ts` - Sandbox analytics and event tracking
- `src/lib/esignature/baa-signing.ts` - BAA e-signature integration
- `src/app/api/sandbox/create/route.ts` - Sandbox creation API endpoint
- `src/app/api/sandbox/convert/route.ts` - Sandbox-to-production conversion API
- `src/app/api/sandbox/tour-progress/route.ts` - Tour progress tracking API
- `src/app/api/sandbox/challenges/route.ts` - Challenge completion tracking API
- `src/app/api/sandbox/analytics/route.ts` - Analytics event logging API
- `src/app/api/cron/expire-sandboxes/route.ts` - Daily sandbox expiration check
- `src/app/sandbox-signup/page.tsx` - Enhanced signup page for sandbox creation
- `src/hooks/useSandbox.ts` - Custom hook for sandbox state and actions
- `src/hooks/useChallenges.ts` - Custom hook for challenge scenarios

### Existing Files to Modify
- `src/contexts/TourContext.tsx` - Enhance with role-specific tours and MongoDB persistence
- `src/lib/auth-minimal.ts` - Add sandbox tier and role capture on signup
- `src/lib/mongodb.ts` - Add sandbox collection schemas
- `src/app/auth/signup/page.tsx` - Add tier/role selection and sandbox creation flow
- `src/app/case-manager/page.tsx` - Integrate sandbox banner and challenges
- `src/app/supervisor/page.tsx` - Integrate supervisor tour and sandbox features
- `src/app/org-admin/page.tsx` - Integrate org admin tour and "Switch View" capability
- `src/components/layout/Sidebar.tsx` - Add sandbox status indicator
- `src/app/layout.tsx` - Wrap app with EnhancedTourContext

### Test Files
- `src/lib/sandbox/__tests__/sandbox-manager.test.ts`
- `src/lib/sandbox/__tests__/dummy-data-seeder.test.ts`
- `src/lib/challenges/__tests__/challenge-framework.test.ts`
- `tests/e2e/sandbox-onboarding.spec.ts` - End-to-end sandbox flow test

---

## Tasks

- [ ] **1.0 Database & Sandbox Infrastructure**
  - [ ] 1.1 Create MongoDB collection schemas for `sandbox_organizations`, `sandbox_tour_progress`, `sandbox_challenges`, `sandbox_analytics_events`
  - [ ] 1.2 Add indexes to new collections for performance (userId, expiresAt, status, sandboxOrgId)
  - [ ] 1.3 Update `organizations` collection schema to add `isSandbox`, `sandboxTier`, `sandboxCreatedFrom` fields
  - [ ] 1.4 Update `users` collection schema to add `sandboxOrgId`, `tourCompleted`, `lastTourStepCompleted` fields
  - [ ] 1.5 Create `src/lib/sandbox/sandbox-manager.ts` with functions: `createSandboxOrg()`, `getSandboxOrg()`, `expireSandbox()`, `convertSandbox()`
  - [ ] 1.6 Create `src/lib/sandbox/sandbox-middleware.ts` to automatically filter queries by `isSandbox` flag
  - [ ] 1.7 Create tier-based dummy data templates (JSON files) for Micro (8-12 clients), Mid (30-40), Enterprise (80-100)
  - [ ] 1.8 Create `src/lib/sandbox/dummy-data-seeder.ts` with tier-specific seeding functions
  - [ ] 1.9 Implement `seedSandboxData(orgId, tier, role)` function that creates realistic clients, referrals, providers, messages
  - [ ] 1.10 Add unit tests for sandbox-manager and dummy-data-seeder

- [ ] **2.0 Enhanced Signup & Sandbox Creation Flow**
  - [ ] 2.1 Update `src/app/auth/signup/page.tsx` to add org tier selection (Micro/Mid/Enterprise) with clear descriptions
  - [ ] 2.2 Add role selection with visual cards (Case Manager, Supervisor, Org Admin) explaining each role
  - [ ] 2.3 Update NextAuth credentials provider in `src/lib/auth-minimal.ts` to capture `tier` and `role` on signup
  - [ ] 2.4 Create `src/app/api/sandbox/create/route.ts` POST endpoint that creates sandbox org + seeds data
  - [ ] 2.5 Implement sandbox creation flow: capture email/password → create user → create sandbox org → seed data → redirect
  - [ ] 2.6 Add loading state during sandbox creation ("Setting up your personalized demo...")
  - [ ] 2.7 Implement role-based redirect after signup (case_manager → /case-manager, supervisor → /supervisor, org_admin → /org-admin)
  - [ ] 2.8 Add error handling for failed sandbox creation with retry mechanism
  - [ ] 2.9 Store sandbox metadata in NextAuth session (isSandbox, sandboxTier, expiresAt)
  - [ ] 2.10 Create `src/hooks/useSandbox.ts` hook to access sandbox state throughout app

- [ ] **3.0 Enhanced Tour System (Role-Specific Tours)**
  - [ ] 3.1 Create `src/lib/tours/case-manager-tour.ts` exporting existing 10-step tour configuration
  - [ ] 3.2 Make Case Manager tour tier-aware (adjust messaging for Micro vs Enterprise)
  - [ ] 3.3 Create `src/lib/tours/supervisor-tour.ts` with 6-step tour: Dashboard → Team → Invite → Assignments → Analytics → Complete
  - [ ] 3.4 Create `src/lib/tours/org-admin-tour.ts` with 8-step tour: Dashboard → Hierarchy → Users → Teams → Invitations → Analytics → Settings → Audit → Complete
  - [ ] 3.5 Add "Switch View" capability to Org Admin tour (experience Case Manager and Supervisor perspectives)
  - [ ] 3.6 Create `src/contexts/EnhancedTourContext.tsx` that wraps existing TourContext
  - [ ] 3.7 Implement `getTourSteps(role, tier, isSandbox)` function to return appropriate tour configuration
  - [ ] 3.8 Update tour progress storage from localStorage to MongoDB via API route
  - [ ] 3.9 Create `src/app/api/sandbox/tour-progress/route.ts` for GET (fetch progress) and PATCH (update progress)
  - [ ] 3.10 Add tour restart button to help menu in sidebar
  - [ ] 3.11 Implement cross-device tour resume (query MongoDB on mount, continue from last step)
  - [ ] 3.12 Wrap `src/app/layout.tsx` with EnhancedTourContext provider
  - [ ] 3.13 Update `src/app/case-manager/page.tsx`, `src/app/supervisor/page.tsx`, `src/app/org-admin/page.tsx` to auto-start appropriate tour on first visit

- [ ] **4.0 Challenge Scenarios & Gamification**
  - [ ] 4.1 Create `src/lib/challenges/challenge-framework.ts` with core challenge types: `ChallengeDefinition`, `ChallengeResult`, `ChallengeState`
  - [ ] 4.2 Implement `ChallengeEngine` class with methods: `startChallenge()`, `checkCompletion()`, `provideHint()`, `recordResult()`
  - [ ] 4.3 Create `src/lib/challenges/case-manager-challenges.ts` with 3 challenges: Quick Match, Communication Master, Status Update Pro
  - [ ] 4.4 Create `src/lib/challenges/supervisor-challenges.ts` with 3 challenges: Rebalancing Act, Team Builder, Performance Monitor
  - [ ] 4.5 Create `src/lib/challenges/org-admin-challenges.ts` with 3 challenges: Organizational Setup, Audit Ready, Analytics Deep Dive
  - [ ] 4.6 Create `src/components/sandbox/ChallengeCard.tsx` component displaying challenge info, timer, hints remaining
  - [ ] 4.7 Create `src/components/sandbox/ChallengeModal.tsx` full-screen challenge execution interface
  - [ ] 4.8 Implement timer functionality with countdown display
  - [ ] 4.9 Implement hint system (3 hints per challenge, progressive disclosure)
  - [ ] 4.10 Add success/failure states with confetti animation on success
  - [ ] 4.11 Create "Certificate of Completion" PDF generation for users who complete all challenges
  - [ ] 4.12 Create `src/app/api/sandbox/challenges/route.ts` for POST (record completion) and GET (fetch completions)
  - [ ] 4.13 Create `src/hooks/useChallenges.ts` hook to manage challenge state and actions
  - [ ] 4.14 Add challenges section to dashboard after tour completion

- [ ] **5.0 Conversion Flow & BAA Signing**
  - [ ] 5.1 Create `src/components/sandbox/ConversionModal.tsx` with 3 steps: Confirmation → BAA Signing → Production Activation
  - [ ] 5.2 Add "Start Real Account" button to sandbox banner (always visible)
  - [ ] 5.3 Implement Step 1: Confirmation modal explaining fresh start, sandbox retention for 7 days
  - [ ] 5.4 Research and select e-signature provider (recommend PandaDoc, fallback to DocuSign)
  - [ ] 5.5 Create `src/lib/esignature/baa-signing.ts` wrapper for e-signature API
  - [ ] 5.6 Implement `generateBAADocument(orgDetails)` function with template
  - [ ] 5.7 Implement `createSigningSession(documentId, signerEmail)` returning iframe URL
  - [ ] 5.8 Implement Step 2: Embed e-signature iframe in modal
  - [ ] 5.9 Create webhook endpoint `src/app/api/webhooks/baa-signed/route.ts` to receive signature completion
  - [ ] 5.10 Create `src/app/api/sandbox/convert/route.ts` POST endpoint for production org creation
  - [ ] 5.11 Implement production org creation: copy user data (not clients/referrals), set `isSandbox: false`, assign new orgId
  - [ ] 5.12 Implement Step 3: Show success message with onboarding checklist (Invite team, Import clients, Create referral)
  - [ ] 5.13 Send welcome email with login credentials and onboarding guide
  - [ ] 5.14 Maintain sandbox access for 7 days post-conversion (for training)
  - [ ] 5.15 Update session to production org after conversion
  - [ ] 5.16 Add conversion tracking to analytics (trigger sales notification)

- [ ] **6.0 Analytics, Tracking & Sales Intelligence**
  - [ ] 6.1 Create `src/lib/analytics/sandbox-tracker.ts` with event tracking functions
  - [ ] 6.2 Implement `trackEvent(userId, sandboxOrgId, eventType, eventData)` function
  - [ ] 6.3 Create `src/app/api/sandbox/analytics/route.ts` POST endpoint for event logging
  - [ ] 6.4 Track key events: page_view, tour_step_completed, challenge_started, challenge_completed, feature_used, conversion_clicked
  - [ ] 6.5 Implement automatic page view tracking via middleware or layout
  - [ ] 6.6 Add event tracking to all major user actions (create client, create referral, send message, etc.)
  - [ ] 6.7 Implement lead scoring algorithm: tour_completed (+20), challenge_completed (+30), multiple_sessions (+10/session), conversion_clicked (+50)
  - [ ] 6.8 Create `src/app/admin/sandbox-intelligence/page.tsx` sales intelligence dashboard
  - [ ] 6.9 Build dashboard widgets: Active Sandboxes, Conversion Funnel, Hot Leads (score >80), Tier Breakdown, Feature Engagement Heatmap
  - [ ] 6.10 Implement real-time updates using SWR or polling
  - [ ] 6.11 Add export functionality for lead data (CSV with engagement metrics)
  - [ ] 6.12 Create email notification system for hot leads (score >80 triggers sales alert)
  - [ ] 6.13 Add "Expiring Soon" section (sandboxes expiring in 2 days)

- [ ] **7.0 Time-Based Access Control & Cron Jobs**
  - [ ] 7.1 Create `src/app/api/cron/expire-sandboxes/route.ts` endpoint for daily expiration check
  - [ ] 7.2 Implement logic to query sandboxes where `expiresAt < now()` and `status = 'active'`
  - [ ] 7.3 Update expired sandboxes to `status: 'expired'` in database
  - [ ] 7.4 Set up Vercel Cron job to run expiration check daily at midnight
  - [ ] 7.5 Create email templates for sandbox lifecycle: Welcome, Mid-Demo Nudge, Expiration Warning, Post-Expiration
  - [ ] 7.6 Implement email sending via Resend (already installed) or existing email service
  - [ ] 7.7 Create `src/lib/emails/sandbox-emails.ts` with functions: `sendWelcomeEmail()`, `sendNudgeEmail()`, `sendExpirationWarning()`, `sendPostExpiration()`
  - [ ] 7.8 Schedule tier-based emails: Micro (Day 3, Day 6), Mid (Day 7, Day 12), Enterprise (Day 15, Day 28)
  - [ ] 7.9 Implement read-only mode for expired sandboxes (view but no edit/create actions)
  - [ ] 7.10 Add persistent banner for expired sandboxes: "Demo expired. Ready to go live?"
  - [ ] 7.11 Allow 1 time extension (7 days) via "Request Extension" button that notifies sales
  - [ ] 7.12 Implement sandbox archival after 90 days (move to cold storage collection or soft delete)

- [ ] **8.0 UI/UX Polish & Testing**
  - [ ] 8.1 Create `src/components/sandbox/SandboxBanner.tsx` persistent yellow banner with "Demo Mode" indicator
  - [ ] 8.2 Add "Start Real Account" button to banner (always accessible)
  - [ ] 8.3 Display time remaining in banner ("5 days left in demo")
  - [ ] 8.4 Style sandbox UI with subtle visual differences (yellow accent color, demo watermarks)
  - [ ] 8.5 Ensure all tours are mobile-responsive (test on tablet/phone)
  - [ ] 8.6 Add keyboard navigation support for all tour steps (Tab, Enter, Esc)
  - [ ] 8.7 Add ARIA labels to tour elements for screen reader accessibility
  - [ ] 8.8 Implement loading states for all async operations (sandbox creation, conversion, challenge submission)
  - [ ] 8.9 Add empty states for challenges section ("No challenges available yet - complete tour first!")
  - [ ] 8.10 Create success animations for tour completion and challenge completion
  - [ ] 8.11 Write E2E test `tests/e2e/sandbox-onboarding.spec.ts` covering: signup → tier/role selection → sandbox creation → tour → challenge → conversion
  - [ ] 8.12 Test sandbox isolation (verify production users can't access sandbox data and vice versa)
  - [ ] 8.13 Test tier-specific experiences (Micro vs Enterprise dummy data, tour messaging)
  - [ ] 8.14 Test expiration logic (manually set expiresAt to past, verify read-only mode)
  - [ ] 8.15 Test cross-browser compatibility (Chrome, Firefox, Safari)
  - [ ] 8.16 Performance audit: sandbox creation <5s, page load <2s, tour transitions smooth
  - [ ] 8.17 Fix any linter errors and type errors
  - [ ] 8.18 Update README with sandbox feature documentation

---

## Implementation Notes

### Tech Stack Decisions (as Lead Engineer):
1. **Shepherd.js Enhancement**: Keep existing TourContext pattern, extend it for role-specific tours
2. **MongoDB Schemas**: New collections for sandbox tracking, leverage existing org structure
3. **E-Signature**: Recommend PandaDoc for BAA signing (good API, reasonable pricing)
4. **Cron Jobs**: Use Vercel Cron for serverless expiration checks
5. **Analytics**: Custom implementation using MongoDB (avoid Mixpanel costs for MVP)

### Strategic Decisions:
- **Leverage existing tour**: Don't rebuild Shepherd.js implementation, enhance it
- **Extend NextAuth**: Add tier/role capture to existing auth flow
- **Query filtering pattern**: Middleware approach for sandbox isolation (MongoDB-native)
- **Challenge framework**: Build modular system that supports future challenge types
- **Conversion flow**: Separate BAA signing from payment (orgs are free, providers pay)

### Next Steps:
Respond with **"Go"** to generate detailed sub-tasks for each parent task.

