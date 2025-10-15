# PRD: Interactive Sandbox Onboarding & Demo Environment

## 1. Introduction/Overview

### Problem Statement
Converting prospective organizations to Referra requires demonstrating immediate, tangible value. Current onboarding approaches in the social services software space are either:
- Too abstract (demo videos, slide decks) - don't convey real product experience
- Too overwhelming (full production access) - leads to analysis paralysis and poor conversion
- Too generic (one-size-fits-all demos) - don't resonate with specific org sizes or roles

Organizations evaluating Referra need to **experience the platform's value firsthand** before committing to BAA agreements and full implementation. This is especially critical because:
1. Decision-makers (Org Admins, Supervisors) need to see organizational value
2. End-users (Case Managers) need to feel confident in day-to-day usability
3. Procurement processes vary dramatically by org size (7 days for micro, 30+ days for enterprise)
4. Case managers are not highly tech-savvy and need guided, confidence-building experiences

### Solution Overview
Build an **Interactive Sandbox Onboarding System** that provides role-specific, tier-based, guided demo experiences using realistic dummy data. This system will:
- Require lightweight signup (Google OAuth) to capture leads
- Deliver controlled, scripted walkthroughs based on user role and org size
- Include challenge scenarios to increase engagement
- Enforce time limits appropriate to org tier
- Seamlessly convert to production accounts after BAA signing

### Goal
Create a world-class, high-converting onboarding experience that reduces time-to-value, increases conversion rates, and builds user confidence before organizations commit to full platform adoption.

---

## 1.1 Existing Platform Features (Building Blocks)

**This feature leverages and enhances existing architecture:**

### ✅ Current Role Infrastructure
- **Org Admin**: Dashboard, Users, Teams, Invitations, Analytics, Settings, Audit Logs (`/org-admin/*`)
- **Supervisor**: Dashboard, Team Members, Client Assignments, Invite System (`/supervisor/*`)
- **Case Manager**: Board view with drawers/panels, Clients, Referrals, Workspace (`/case-manager/*`)
- **Provider**: Dashboard, Referrals, Network, Capacity, Workspace (`/provider/*`)
- **Platform Admin**: Complete system oversight (`/admin/*`)

### ✅ Current Technical Stack
- **Database**: MongoDB (v6.17.0) with collections for organizations, users, clients, referrals
- **Authentication**: NextAuth (v4.24.11) with role-based access control
- **UI Components**: shadcn/ui, Tailwind CSS, Board/Drawer/Panel patterns
- **Tour System**: Shepherd.js (v14.5.0) with 10-step Case Manager tour (`TourContext.tsx`)

### ✅ Current User Flows
- Organization creation and team hierarchy
- User invitation system (supervisor → case manager)
- Client management (CRUD, board view, drawers)
- Referral creation and tracking
- HIPAA-compliant workspace messaging
- Provider network and matching

**What This PRD Adds**: Sandbox isolation layer, tier-based demo experiences, role-specific tours, challenge scenarios, conversion flow, and BAA signing integration.

---

## 2. Goals

### Primary Goals
1. **Increase Conversion Rates**: Achieve 40%+ sandbox-to-production conversion rate (industry benchmark: 15-25%)
2. **Reduce Sales Cycle**: Cut time-to-close by 30% through self-service education
3. **Capture Qualified Leads**: 100% of demo users provide contact information (via signup)
4. **Demonstrate Value Fast**: Users experience core value proposition within 5 minutes
5. **Build User Confidence**: Case managers feel capable and excited to use the platform

### Secondary Goals
6. **Segment Market Understanding**: Track which org tiers convert best to inform marketing strategy
7. **Feature Validation**: Identify which features drive the most engagement in sandbox
8. **Reduce Support Load**: Pre-educate users so they require less onboarding support post-purchase
9. **Enable Multiple Stakeholders**: Allow different roles to explore relevant features independently

---

## 3. User Stories

### As an Org Admin (Sarah, TruWell MN - 350 clients)
- I want to see how Referra handles organizational oversight so I can justify the investment to my board
- I want to experience the full user hierarchy (admin → supervisor → case manager) so I understand team workflows
- I want to explore with realistic data (mid-tier org size) so I can envision my actual use case
- I need 14 days to evaluate because I need to present to my leadership team

### As a Case Manager (Maria, Micro Org - 40 clients)
- I want a simple, guided tour that shows me exactly what I'll do daily
- I want to try creating a referral without fear of breaking anything
- I want to see how workspace communication works with providers
- I need confirmation that this won't be overwhelming or complicated
- I want to make a decision quickly (within 7 days) because I need help NOW

### As a Supervisor (John, Mid-Tier Org - 180 clients)  
- I want to see team management and caseload balancing capabilities
- I want to understand how I'll invite and manage case managers
- I want to explore client assignment workflows
- I need to evaluate this over 14 days while consulting with my team

### As an Enterprise Org Admin (Robert, Large Network - 1200 clients)
- I want to see advanced features like analytics, audit logs, and compliance tools
- I want to understand how the platform scales to large teams
- I need 30 days to evaluate because procurement requires multiple approval layers
- I want to see ROI projections based on realistic enterprise data

### As a Platform Admin (Referra Team)
- I want to track which features prospects engage with most
- I want to identify drop-off points in the demo experience
- I want to automate lead qualification based on sandbox behavior
- I want seamless handoff to sales team when prospects are ready to convert

---

## 4. Functional Requirements

### 4.1 Signup & Access Flow

**FR-1.1**: Landing page SHALL include prominent "Try Demo Now" CTA  
**FR-1.2**: "Try Demo Now" SHALL trigger signup/login modal (not direct sandbox access)  
**FR-1.3**: System SHALL support Google OAuth for one-click signup  
**FR-1.4**: Signup flow SHALL capture: Name, Email, Organization Name, Role, Org Size (Micro/Mid/Enterprise)  
**FR-1.5**: System SHALL auto-detect if user already has an account and prevent duplicate sandbox creation  
**FR-1.6**: After signup, system SHALL immediately redirect to appropriate sandbox experience (no delay)

### 4.2 Tier & Role Selection

**FR-2.1**: Signup form SHALL ask "What best describes your organization?"
- Micro: Under 100 clients
- Mid-Tier: 100-400 clients  
- Enterprise: 400+ clients

**FR-2.2**: Signup form SHALL ask "What's your role?"
- Case Manager
- Supervisor
- Org Admin
- Other (opens to sales team)

**FR-2.3**: System SHALL create sandbox environment matching selected tier + role combination  
**FR-2.4**: System SHALL NOT allow users to switch tiers/roles after creation (prevents gaming the system)

### 4.3 Sandbox Environment Architecture

**FR-3.1**: Each sandbox SHALL be isolated from production data with `is_sandbox: true` flag on organization  
**FR-3.2**: Sandbox SHALL use cloned production schema with seeded dummy data  
**FR-3.3**: Sandbox SHALL include realistic dummy data:
- **Micro**: 8-12 clients, 2 providers, 1 case manager, 1 supervisor, 1 org admin
- **Mid-Tier**: 30-40 clients, 5 providers, 3 case managers, 1 supervisor, 1 org admin
- **Enterprise**: 80-100 clients, 12 providers, 8 case managers, 3 supervisors, 1 org admin

**FR-3.4**: Dummy data SHALL include diverse, realistic scenarios:
- Various service types (ARMHS, 245D, CADI, etc.)
- Different client statuses (Active-Stable, Active-Frustrated, Unplaced)
- Pre-existing referrals in various states
- Historical workspace communications
- Pending update requests

**FR-3.5**: System SHALL create a dedicated sandbox database organization for each signup  
**FR-3.6**: Sandbox SHALL be fully functional (not read-only) - users can create, edit, delete  
**FR-3.7**: All sandbox actions SHALL be logged for analytics purposes

### 4.4 Guided Demo Experience

**FR-4.1**: Sandbox SHALL launch with an interactive onboarding overlay (not blocking modal)  
**FR-4.2**: Overlay SHALL include:
- Welcome message personalized to role and tier
- Progress indicator (e.g., "3 of 7 steps completed")
- Skip option (for power users)
- Minimize/restore capability

**FR-4.3**: Guided tour SHALL be role-specific:

#### **Case Manager Tour** (7 steps):
1. Welcome to Your Dashboard - Overview of board view
2. Meet Your Clients - Click on a client card to open drawer
3. Review Client Details - Explore tabs (Overview, Timeline, Communications)
4. Create a Referral - Guided flow through `/case-manager/new-referral`
5. Use Workspace - Send a message to a provider
6. Request Updates - Use bulk update request feature
7. Track Progress - See how referrals move through statuses

#### **Supervisor Tour** (6 steps):
1. Welcome to Team Management - Overview of supervisor dashboard
2. View Your Team - See case managers and their caseloads
3. Invite a Case Manager - Walk through invitation flow (simulate, don't actually send)
4. Rebalance Caseloads - Drag-and-drop client assignment
5. Monitor Team Performance - View analytics dashboard
6. Access All Client Records - Show organizational oversight capabilities

#### **Org Admin Tour** (8 steps):
1. Welcome to Organizational Command Center
2. View Platform Hierarchy - Understand org → supervisor → case manager structure
3. Organizational Analytics - See metrics dashboard
4. Invite Team Members - Supervisor and case manager invitation
5. Client Oversight - View all organizational clients
6. Compliance & Audit Logs - HIPAA compliance features
7. Settings & Configuration - Org-level settings
8. See Case Manager Experience - "Switch View" to see what case managers see daily

**FR-4.4**: Each step SHALL include:
- Highlighted UI element (spotlight effect)
- Contextual tooltip with clear instruction
- "Next" button to advance
- "Back" button to review previous step
- Step counter (e.g., "Step 3 of 7")

**FR-4.5**: System SHALL track step completion for analytics  
**FR-4.6**: Users SHALL be able to restart the tour at any time from settings  
**FR-4.7**: Tour SHALL auto-save progress (if user leaves and returns, resume where they left off)

### 4.5 Challenge Scenarios

**FR-5.1**: After completing guided tour, system SHALL present optional "Challenge Scenarios"

#### **Case Manager Challenges**:
1. **Quick Match Challenge**: "Sarah needs autism services urgently. Create and submit a referral in under 3 minutes."
2. **Communication Master**: "Provider hasn't responded in 48 hours. Request an update and check workspace."
3. **Status Update Pro**: "Move 3 clients from Active-Frustrated to Active-Stable by resolving their issues."

#### **Supervisor Challenges**:
1. **Rebalancing Act**: "Case Manager A has 35 clients, Case Manager B has 12. Rebalance to under 28 each."
2. **Team Builder**: "Invite a new case manager and assign them 8 clients."
3. **Performance Monitor**: "Identify which case manager has the highest referral success rate."

#### **Org Admin Challenges**:
1. **Organizational Setup**: "Set up a complete team hierarchy with 1 supervisor and 3 case managers."
2. **Audit Ready**: "Export compliance report for Q1 showing all referral activity."
3. **Analytics Deep Dive**: "Identify your organization's average time-to-placement."

**FR-5.2**: Each challenge SHALL have:
- Clear objective statement
- Timer (optional, for gamification)
- Hint system (3 hints available)
- Success confirmation with congratulatory message
- Failure state with "Try Again" option

**FR-5.3**: Completing challenges SHALL unlock "Certificate of Completion" (shareable badge/PDF)  
**FR-5.4**: Challenge completion SHALL trigger higher-priority sales follow-up (indicates strong engagement)

### 4.6 Time-Based Access Control

**FR-6.1**: System SHALL enforce tier-based time limits:
- **Micro**: 7 days full access
- **Mid-Tier**: 14 days full access
- **Enterprise**: 30 days full access

**FR-6.2**: System SHALL send reminder emails:
- Day 3 (Micro), Day 7 (Mid), Day 15 (Enterprise): "You're halfway through your demo"
- Day 6 (Micro), Day 12 (Mid), Day 28 (Enterprise): "2 days left - Ready to go live?"
- Day 7 (Micro), Day 14 (Mid), Day 30 (Enterprise): "Demo expired - Let's get you started for real"

**FR-6.3**: After time expiration, sandbox SHALL become read-only (view but not edit)  
**FR-6.4**: Expired sandbox SHALL display persistent banner: "Demo expired. Ready to go live? [Start Real Account]"  
**FR-6.5**: Users MAY request 1 time extension (7 days additional) by contacting sales  
**FR-6.6**: System SHALL track time-to-conversion metrics for each tier

### 4.7 Conversion Flow (Sandbox → Production)

**FR-7.1**: Sandbox SHALL include persistent "Start Real Account" CTA in navigation  
**FR-7.2**: "Start Real Account" SHALL trigger conversion flow:

**Step 1: Confirmation Modal**
- "Ready to make this real?"
- Explain: Fresh production environment, dummy data will not transfer
- "Your sandbox will remain available for 7 days for training purposes"

**Step 2: BAA Signing**
- Redirect to e-signature platform (DocuSign/PandaDoc integration)
- Requires: Org Admin name, title, organization legal name, address
- Upload BAA document template
- Track signing status

**Step 3: Payment Setup** (Provider-only requirement, N/A for organizations)
- N/A for case manager organizations (they're free)

**Step 4: Production Activation**
- Create production organization with `is_sandbox: false`
- Send welcome email with login credentials
- Provide onboarding checklist:
  - [ ] Invite team members
  - [ ] Import clients (CSV upload)
  - [ ] Connect with providers
  - [ ] Create first real referral

**FR-7.3**: System SHALL maintain sandbox access for 7 days post-conversion (for training purposes)  
**FR-7.4**: After 7 days, sandbox SHALL be archived (not deleted, for support/debugging)  
**FR-7.5**: Conversion event SHALL trigger sales notification with full engagement analytics  
**FR-7.6**: System SHALL track conversion rate by tier, role, and time-to-convert

### 4.8 Multi-Role Sandbox Experience

**FR-8.1**: Org Admin sandbox SHALL include ability to "Switch View" to experience other roles  
**FR-8.2**: "Switch View" SHALL allow toggling between:
- Org Admin perspective (default)
- Supervisor perspective (see team management)
- Case Manager perspective (see day-to-day workflow)

**FR-8.3**: Each perspective SHALL maintain consistent dummy data (same clients/referrals across views)  
**FR-8.4**: Switching views SHALL NOT reset guided tour progress  
**FR-8.5**: Non-admin roles (Case Manager, Supervisor) SHALL NOT have "Switch View" capability

### 4.9 In-App Tooltips & Help

**FR-9.1**: Sandbox SHALL include contextual tooltips on all major features  
**FR-9.2**: Tooltips SHALL use visual hierarchy:
- 🎯 Core feature (essential to workflow)
- 💡 Pro tip (power user feature)
- ⚠️ Important note (security/compliance context)

**FR-9.3**: Tooltips SHALL be dismissible permanently (per user)  
**FR-9.4**: System SHALL include floating help widget (bottom-right corner)  
**FR-9.5**: Help widget SHALL include:
- Restart guided tour
- Jump to specific tour step
- Search documentation
- Contact support
- View challenge scenarios

### 4.10 Analytics & Tracking

**FR-10.1**: System SHALL track sandbox user behavior:
- Signup source (landing page, email campaign, etc.)
- Role and tier selection
- Time spent in sandbox
- Features used (which pages visited, which actions taken)
- Guided tour completion rate
- Challenge scenario attempts and completions
- Time-to-conversion
- Drop-off points

**FR-10.2**: System SHALL create sales intelligence dashboard showing:
- Active sandbox users (live count)
- Conversion funnel (Signup → Tour Complete → Challenge Complete → Convert)
- Tier-specific conversion rates
- Most engaging features
- Average time-to-decision by tier

**FR-10.3**: System SHALL assign lead scores based on engagement:
- Tour completed: +20 points
- Challenge completed: +30 points
- Multiple sessions: +10 points per session
- "Start Real Account" clicked: +50 points (hot lead)
- Time in sandbox: +1 point per hour
- Lead score >80: Auto-notify sales team

**FR-10.4**: Analytics SHALL be exportable to CRM (HubSpot/Salesforce integration)

### 4.11 Technical Architecture Requirements

**FR-11.1**: Sandbox organizations SHALL use isolated database records with `is_sandbox: true` flag  
**FR-11.2**: All queries SHALL filter sandbox data from production queries using WHERE clause  
**FR-11.3**: Sandbox SHALL use same codebase as production (no separate "demo app")  
**FR-11.4**: Dummy data seeding SHALL be automated via migration scripts  
**FR-11.5**: System SHALL support concurrent sandbox sessions (no shared sandbox state)  
**FR-11.6**: Sandbox SHALL enforce same security policies as production (RLS, encryption)  
**FR-11.7**: Sandbox creation SHALL complete in <5 seconds (no noticeable delay after signup)  
**FR-11.8**: System SHALL garbage collect expired sandboxes after 90 days (archive to cold storage)

### 4.12 Email & Communication Automation

**FR-12.1**: System SHALL send automated email series:

**Welcome Email** (Immediate after signup):
- "Welcome to Referra - Your demo is ready!"
- Direct link to sandbox
- Overview of what to explore
- Estimate: "Most users complete the tour in 10 minutes"

**Mid-Demo Nudge** (Day 3/7/15 based on tier):
- "How's your demo going?"
- Link to challenges if not yet attempted
- Offer to schedule live walkthrough with team

**Expiration Warning** (2 days before expiration):
- "Your demo expires in 2 days"
- Highlight conversion benefits
- "Start Real Account" CTA

**Post-Expiration** (Day after expiration):
- "Ready to go live?"
- Case study / social proof
- Easy conversion path

**Conversion Confirmation** (After BAA signed):
- "Welcome to Referra - Let's get you started!"
- Onboarding checklist
- Schedule kickoff call
- Training resources

**FR-12.2**: All emails SHALL include sandbox engagement summary (e.g., "You've explored 8 features and completed 2 challenges!")  
**FR-12.3**: Email cadence SHALL respect user preferences (opt-out capability)

---

## 5. Non-Goals (Out of Scope)

### Explicitly NOT Included:
1. **Free Plan**: This is a demo/trial, not a permanently free tier
2. **Data Migration**: Sandbox data will NOT transfer to production (clean slate approach)
3. **Customizable Demos**: No ability for users to create custom demo scenarios
4. **Live Collaboration**: No multi-user sandbox sessions (each signup gets isolated environment)
5. **Provider Sandbox**: Focus is on organization-side users (case managers, supervisors, org admins) - provider demo is separate feature
6. **White-Label Demos**: All demos are Referra-branded
7. **Offline Mode**: Sandbox requires internet connection
8. **Mobile App**: Sandbox accessible via mobile web, but no native app
9. **Video Tutorials**: In-app tooltips only (video library is separate marketing asset)
10. **AI-Powered Assistance**: No chatbot or AI guide (may be future enhancement)

---

## 6. Design Considerations

### 6.1 Visual Design

**Sandbox Indicator**:
- Persistent yellow banner at top: "🎯 Demo Mode - Exploring Referra with sample data"
- "Start Real Account" button in banner (always accessible)
- Different accent color scheme (subtle) to distinguish from production

**Guided Tour UI**:
- Semi-transparent spotlight effect on active element
- Tooltip cards with drop shadows for depth
- Progress bar at top showing tour completion
- Skip/minimize options never fully hidden

**Challenge Scenarios**:
- Badge/trophy iconography for completed challenges
- Timer displayed prominently (if applicable)
- Success animations (confetti, checkmark burst)

### 6.2 UX Patterns

**Progressive Disclosure**:
- Start with 1-2 core features, gradually introduce advanced capabilities
- Don't overwhelm with all features at once
- Build confidence before complexity

**Positive Reinforcement**:
- Celebrate small wins ("Great! You just created your first referral!")
- Use encouraging language ("You're getting the hang of this!")
- Provide immediate feedback on actions

**Safety & Confidence**:
- Explicit messaging: "This is sample data - experiment freely!"
- Undo capability for all actions
- "Reset Sandbox" option if they want to start fresh

**Conversion Optimization**:
- "Start Real Account" CTA uses action-oriented language
- Social proof near CTA ("Join 50+ organizations already using Referra")
- Benefits list on conversion modal (not just features)

### 6.3 Accessibility

- All guided tour elements MUST be keyboard-navigable
- Screen reader announcements for tour steps
- High contrast mode for visually impaired users
- Closed captions for any embedded video content
- ARIA labels on all interactive elements

### 6.4 Responsive Design

- Guided tour MUST work on tablet (iPad) - primary use case for case managers
- Mobile web supported but with simplified tour (fewer steps)
- Desktop gets full experience with multi-panel views

---

## 7. Technical Considerations

**🔑 Key Principle: Build on Existing Architecture**

This feature enhances and extends your current platform rather than rebuilding from scratch:
- ✅ **Leverage existing Shepherd.js tour** (`TourContext.tsx`)
- ✅ **Use MongoDB** (already configured)
- ✅ **Build on NextAuth** (already implemented)
- ✅ **Extend org admin, supervisor, case manager roles** (already exist)
- ✅ **Utilize existing board, drawer, panel UI** (case manager dashboard)

**What We're Adding**:
- Sandbox organization isolation via `isSandbox` flag
- Role-specific tour variations (Supervisor, Org Admin)
- Tier-based dummy data seeding (Micro, Mid, Enterprise)
- Challenge scenarios and analytics tracking
- BAA signing and conversion flow

---

### 7.1 Database Schema Changes (MongoDB)

**New Collections Required**:

```javascript
// Collection: sandbox_organizations
{
  _id: ObjectId,
  organizationId: ObjectId,  // References organizations collection
  userId: ObjectId,           // References users collection
  tier: String,               // 'micro' | 'mid' | 'enterprise'
  role: String,               // 'case_manager' | 'supervisor' | 'org_admin'
  createdAt: Date,
  expiresAt: Date,
  status: String,             // 'active' | 'expired' | 'converted' | 'archived'
  convertedToOrgId: ObjectId, // References production org after conversion
  convertedAt: Date
}

// Collection: sandbox_tour_progress
{
  _id: ObjectId,
  sandboxOrgId: ObjectId,     // References sandbox_organizations
  userId: ObjectId,
  role: String,
  currentStep: Number,
  completedSteps: [Number],   // Array of completed step indices
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Collection: sandbox_challenges
{
  _id: ObjectId,
  sandboxOrgId: ObjectId,
  userId: ObjectId,
  challengeKey: String,       // e.g., 'quick-match', 'rebalancing-act'
  completedAt: Date,
  timeTakenSeconds: Number,
  hintsUsed: Number,
  createdAt: Date
}

// Collection: sandbox_analytics_events
{
  _id: ObjectId,
  sandboxOrgId: ObjectId,
  userId: ObjectId,
  eventType: String,          // 'page_view', 'action_taken', 'feature_used'
  eventData: Object,          // Flexible event metadata
  createdAt: Date
}
```

**Schema Modifications to Existing Collections**:

```javascript
// Update organizations collection
{
  // ... existing fields
  isSandbox: Boolean,         // NEW: Flag to identify sandbox orgs
  sandboxTier: String,        // NEW: 'micro' | 'mid' | 'enterprise' (if sandbox)
  sandboxCreatedFrom: ObjectId, // NEW: References user who created sandbox
}

// Update users collection  
{
  // ... existing fields
  sandboxOrgId: ObjectId,     // NEW: References active sandbox org (if any)
  tourCompleted: Boolean,     // NEW: Track if user completed guided tour
  lastTourStepCompleted: Number, // NEW: Resume tour from this step
}

// Indexes for performance
db.sandbox_organizations.createIndex({ userId: 1, status: 1 })
db.sandbox_organizations.createIndex({ expiresAt: 1, status: 1 })
db.sandbox_organizations.createIndex({ organizationId: 1 })
db.sandbox_tour_progress.createIndex({ userId: 1, sandboxOrgId: 1 })
db.sandbox_analytics_events.createIndex({ sandboxOrgId: 1, eventType: 1, createdAt: -1 })
```

### 7.2 Dummy Data Seeding Strategy

**Approach**: Pre-generated seed data with randomization for uniqueness

**Implementation**:
1. Create dummy data templates (JSON files with realistic cases)
2. Seed function that clones templates and randomizes:
   - Client names (use faker.js or similar)
   - Dates (relative to sandbox creation date)
   - IDs (generate new UUIDs)
3. Tier-specific seed amounts (8-12 for micro, 30-40 for mid, 80-100 for enterprise)
4. Include pre-existing referrals, messages, and activities for realism

**Performance**:
- Seed data on signup (async job, <5 seconds)
- Use database transactions for atomicity
- Implement retries for reliability

### 7.3 Guided Tour Implementation

**Current Implementation**:
- ✅ **Already using Shepherd.js** (v14.5.0) via `TourContext.tsx`
- ✅ **10-step Case Manager tour** already built and functional
- ✅ **Auto-starts for new users** on first visit to `/case-manager`
- ⚠️ **Limitation**: Currently only for Case Managers, uses localStorage

**Enhancement Strategy**:
1. **Extend Existing TourContext** (don't rebuild from scratch)
2. **Add Role-Specific Tours**:
   - Keep existing Case Manager tour (10 steps)
   - Add new Supervisor tour (6 steps)
   - Add new Org Admin tour (8 steps)
3. **Upgrade Storage**:
   - Migrate from localStorage to MongoDB for persistence
   - Track progress per sandbox organization
   - Enable resume across devices/sessions
4. **Add Sandbox-Specific Features**:
   - Tier-aware messaging (Micro vs Enterprise experiences)
   - Challenge scenarios post-tour
   - Analytics tracking integration

**Implementation Approach**:
```typescript
// Enhance existing TourContext.tsx
interface TourConfig {
  role: 'case_manager' | 'supervisor' | 'org_admin';
  tier: 'micro' | 'mid' | 'enterprise';
  isSandbox: boolean;
}

// Keep existing tour steps, add new role-specific tours
const getTourSteps = (config: TourConfig) => {
  switch (config.role) {
    case 'case_manager': return getCaseManagerTour(config.tier);
    case 'supervisor': return getSupervisorTour(config.tier);
    case 'org_admin': return getOrgAdminTour(config.tier);
  }
}
```

**State Management**:
- Enhance existing Context API pattern already in place
- Add MongoDB persistence via API routes
- Keep localStorage as fallback for offline scenarios

### 7.4 Time-Based Access Control

**Implementation**:
- Cron job runs daily at midnight (server timezone)
- Checks `expires_at` field in `sandbox_organizations`
- Updates status to 'expired' and sends notification emails
- Expired sandboxes remain readable (soft delete approach)

**Considerations**:
- Allow manual extension via admin dashboard (support cases)
- Grace period: 1 extra day before hard cutoff (account for timezones)

### 7.5 E-Signature Integration

**Options**:
1. **DocuSign** - Industry standard, robust API, $$$
2. **PandaDoc** - Good middle ground, reasonable pricing
3. **HelloSign (Dropbox Sign)** - Simple, affordable, limited features
4. **Custom Solution** - esignature.io API wrapper

**Recommendation**: Start with PandaDoc (good balance of features and cost)

**Flow**:
1. User clicks "Start Real Account"
2. Pre-fill BAA template with org details
3. Generate signing link via API
4. Redirect user to PandaDoc iframe
5. Webhook callback on signature completion
6. Activate production account

### 7.6 Performance Optimization

**Critical Path**:
- Sandbox creation must be <5 seconds
- Use background jobs for seed data generation
- Cache dummy data templates in Redis
- Optimize database queries with proper indexes

**Monitoring**:
- Track sandbox creation time (alert if >5s)
- Monitor database size growth (sandbox data accumulates)
- Alert on failed seed jobs

### 7.7 Security Considerations

**Sandbox Isolation (MongoDB Approach)**:
- All database queries MUST filter by `isSandbox` flag
- Middleware to automatically append `isSandbox: true` filter for sandbox routes
- Sandbox users CANNOT access production organizations (enforced via session check)
- Production users CANNOT access sandbox data (query filtering)
- All standard security policies apply (encryption, NextAuth, etc.)

**Query Filtering Pattern**:
```javascript
// Example: All queries must check isSandbox flag
const getSandboxOrganization = async (userId) => {
  return await db.collection('organizations').findOne({
    isSandbox: true,
    sandboxCreatedFrom: new ObjectId(userId)
  });
};

// Middleware to enforce sandbox isolation
export function sandboxMiddleware(req, res, next) {
  if (req.session.user.inSandbox) {
    req.query.isSandbox = true;
    req.query.sandboxOrgId = req.session.user.sandboxOrgId;
  }
  next();
}
```

**Abuse Prevention**:
- Rate limit sandbox creation (max 3 per email address)
- CAPTCHA on signup to prevent bot signups
- Monitor for abusive behavior (mass data creation, API abuse)

---

## 8. Success Metrics

### Primary KPIs

**Conversion Metrics**:
- **Sandbox-to-Production Conversion Rate**: Target 40% (baseline: 15-25% industry standard)
- **Time-to-Conversion**: Track average days from signup to BAA signed
- **Tier-Specific Conversion**: Break down by Micro/Mid/Enterprise

**Engagement Metrics**:
- **Tour Completion Rate**: Target 70%
- **Challenge Completion Rate**: Target 30%
- **Return Visitor Rate**: % who log back in after initial session (Target: 60%)
- **Features Explored**: Average number of pages visited per user (Target: 12+)

**Sales Efficiency**:
- **Lead Quality Score**: Average lead score of sandbox users vs. other channels
- **Sales Cycle Time**: Reduction in days from first contact to close (Target: -30%)
- **Demo-to-Meeting Rate**: % of sandbox users who book sales calls (Target: 25%)

### Secondary KPIs

**User Experience**:
- **Time in Sandbox**: Average session duration (Target: 15+ minutes)
- **Feature Discovery Rate**: % of users who find key features (workspace, referrals, etc.)
- **Support Ticket Rate**: Sandbox users should require <10% support tickets vs. direct signups

**Product Insights**:
- **Most Engaging Features**: Which features get the most interaction in sandbox
- **Drop-off Points**: Where users abandon the tour or sandbox
- **Challenge Difficulty**: Completion rates by challenge (identify if too hard/easy)

**Technical Performance**:
- **Sandbox Creation Time**: Average time from signup to first page load (Target: <5s)
- **Uptime**: Sandbox availability (Target: 99.9%)
- **Error Rate**: % of sandbox sessions with errors (Target: <1%)

### Analytics Dashboard Views

**Exec Dashboard**:
- Real-time active sandbox users
- Conversion funnel visualization
- Week-over-week growth
- Revenue impact estimate

**Sales Dashboard**:
- Hot leads (lead score >80)
- Expiring sandboxes (needs outreach)
- Engagement details per prospect
- Best time to reach out (based on activity patterns)

**Product Dashboard**:
- Feature usage heatmap
- Tour completion funnel
- Challenge completion rates
- User feedback and support tickets

---

## 9. Open Questions

### Pre-Implementation Questions

**Q1**: Should we allow users to "reset" their sandbox and start over with fresh data?
- **Impact**: Could extend engagement but also delay decision-making
- **Recommendation**: Allow 1 reset per sandbox to give second chance

**Q2**: Should we offer a "Schedule Live Demo" option within sandbox?
- **Impact**: Provides personal touch for high-value prospects
- **Recommendation**: Yes, prominently place for Enterprise tier users

**Q3**: How do we handle users who sign up multiple times (different emails)?
- **Impact**: Could game the time limits or create fake accounts
- **Recommendation**: Track by IP + browser fingerprint, limit to 3 sandboxes per unique device

**Q4**: Should sandbox include AI features (if/when we build them)?
- **Impact**: Could be competitive differentiator or overwhelming
- **Recommendation**: Include but make it an optional "Advanced Features" tour step

**Q5**: Should we create different dummy data scenarios (e.g., "Autism Services Org" vs "Mental Health Org")?
- **Impact**: More relevant demos but more complex to maintain
- **Recommendation**: Phase 2 enhancement - start with general social services data

**Q6**: Should we allow exporting sandbox data (reports, etc.) for internal advocacy?
- **Impact**: Helps org admins build internal business case
- **Recommendation**: Yes, allow CSV exports of reports - add watermark "Sample Data - Referra Demo"

**Q7**: Should we integrate with calendar tools (Calendly/Cal.com) for automated demo booking?
- **Impact**: Reduces friction for sales conversations
- **Recommendation**: Yes, embed Calendly for Enterprise tier users

**Q8**: Should we provide a "Compare Plans" view in sandbox (if we have tiered pricing)?
- **Impact**: Currently orgs are free, but could apply to provider tiers
- **Recommendation**: Not applicable for org users; separate provider demo handles this

**Q9**: Should we collect qualitative feedback at end of sandbox (survey)?
- **Impact**: Valuable product insights but adds friction
- **Recommendation**: Yes, optional survey on conversion or expiration ("What did you think?")

**Q10**: How do we handle data privacy regulations (GDPR, CCPA) for sandbox users?
- **Impact**: Must comply with data privacy laws
- **Recommendation**: Add privacy policy acceptance to signup, provide data deletion on request

### Post-Launch Optimization Questions

**Q11**: What's the optimal sandbox duration for each tier? (May need to adjust based on data)  
**Q12**: Should we A/B test different guided tour flows?  
**Q13**: Should we create role-specific challenge scenarios or keep them general?  
**Q14**: Should we add "Share Your Demo" feature (let users share their sandbox with colleagues)?  
**Q15**: Should we build a "Sandbox Hall of Fame" showcasing power users who completed all challenges?

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- **Database schema updates** (new MongoDB collections for sandbox tracking)
- **Authentication flow updates** (capture role + tier on signup in NextAuth)
- **Dummy data seeding scripts** (all three tiers: micro/mid/enterprise)
- **Basic sandbox isolation** (`isSandbox` flag + query filtering middleware)
- **Time-based access control** (expiration logic via cron job)

### Phase 2: Guided Tour Enhancement (Weeks 3-4)
- **Enhance existing TourContext.tsx** (don't rebuild, extend it)
- **Keep existing Case Manager tour** (10 steps) - make it sandbox-aware
- **Add Supervisor tour** (6 steps) using same Shepherd.js pattern
- **Add Org Admin tour** (8 steps) with "Switch View" capability
- **Upgrade tour storage** (MongoDB instead of localStorage)
- **Tour progress tracking and persistence** across sessions

### Phase 3: Challenge Scenarios (Week 5)
- Build challenge framework (timer, hints, success/fail states)
- Implement 3 challenges per role
- Certificate of completion generation

### Phase 4: Conversion Flow (Week 6)
- BAA e-signature integration (PandaDoc/DocuSign)
- "Start Real Account" flow
- Production account creation automation
- Post-conversion sandbox retention (7-day training period)

### Phase 5: Analytics & Optimization (Week 7)
- Event tracking implementation
- Sales intelligence dashboard
- Lead scoring algorithm
- CRM integration (HubSpot/Salesforce)

### Phase 6: Polish & Launch (Week 8)
- Email automation sequences
- Mobile responsiveness testing
- Accessibility audit and fixes
- Load testing and performance optimization
- Beta testing with 10-15 users
- Production launch

---

## 11. Dependencies

### External Dependencies
1. **E-Signature Platform**: PandaDoc or DocuSign account + API access
2. **Email Service**: Existing email provider (SendGrid/Postmark) for automation
3. **Analytics Platform**: Mixpanel/Amplitude or custom analytics setup
4. **CRM Integration**: HubSpot/Salesforce API (if required)

### Internal Dependencies
1. **Authentication System**: NextAuth already configured, needs role + tier capture enhancement
2. **Dummy Data**: Need realistic client/provider/referral data for seeding
3. **Deployment Pipeline**: Sandbox should deploy alongside production (same codebase)
4. **Support Team**: Training on sandbox troubleshooting and lead handoff

### Technical Dependencies (Already Installed ✅)
1. **Next.js 14.1.0**: ✅ Already using
2. **MongoDB**: ✅ Already configured (v6.17.0)
3. **NextAuth**: ✅ Already implemented (v4.24.11)
4. **Shepherd.js**: ✅ Already installed (v14.5.0) - Just needs enhancement
5. **Existing TourContext**: ✅ Already built (`src/contexts/TourContext.tsx`)

### New Dependencies Required
1. **Cron Job System**: For expiration checks and email triggers (consider `node-cron` or Vercel Cron)
2. **E-Signature SDK**: PandaDoc or DocuSign SDK for BAA signing

---

## 12. Risks & Mitigation

### Risk 1: Low Conversion Rate Despite Sandbox
**Likelihood**: Medium | **Impact**: High  
**Mitigation**:
- A/B test different tour flows and messaging
- Implement exit surveys to understand objections
- Offer personalized demo calls for high-value prospects

### Risk 2: Sandbox Data Leaks to Production
**Likelihood**: Low | **Impact**: Critical  
**Mitigation**:
- Rigorous testing of RLS policies
- Automated tests that verify data isolation
- Regular security audits
- Clear visual indicators (banner) to distinguish sandbox

### Risk 3: Users Game the System (Multiple Signups)
**Likelihood**: Medium | **Impact**: Low  
**Mitigation**:
- Rate limiting by IP + device fingerprint
- CAPTCHA on signup
- Monitor for suspicious patterns (same org name, similar emails)

### Risk 4: Slow Sandbox Creation Causes Drop-off
**Likelihood**: Medium | **Impact**: High  
**Mitigation**:
- Optimize seed data generation (<5s)
- Use background jobs with loading states
- Cache dummy data templates
- Performance monitoring and alerts

### Risk 5: Guided Tour Feels Annoying or Patronizing
**Likelihood**: Medium | **Impact**: Medium  
**Mitigation**:
- Always provide "Skip" option
- Use encouraging, non-condescending language
- Beta test with target users (case managers)
- Make tour optional after first run

### Risk 6: BAA Signing Process Breaks Conversion Flow
**Likelihood**: Low | **Impact**: High  
**Mitigation**:
- Thoroughly test e-signature integration
- Provide fallback (manual BAA upload)
- Clear error messaging and support contact
- Monitor webhook reliability

---

## 13. Launch Checklist

### Pre-Launch
- [ ] All database migrations tested and deployed
- [ ] Dummy data seeding scripts verified for all tiers
- [ ] Guided tours tested on all roles
- [ ] Challenge scenarios functional
- [ ] Time-based expiration logic working
- [ ] BAA signing integration tested end-to-end
- [ ] Email sequences scheduled and tested
- [ ] Analytics tracking verified
- [ ] Mobile responsiveness confirmed
- [ ] Accessibility audit passed
- [ ] Load testing completed (100+ concurrent sandbox users)
- [ ] Security audit completed
- [ ] Support team trained
- [ ] Sales team trained on lead handoff

### Launch Day
- [ ] Feature flag enabled for sandbox signup
- [ ] Monitoring dashboards active
- [ ] On-call rotation scheduled
- [ ] Marketing pages updated (landing page CTA)
- [ ] Social media announcements ready
- [ ] Email campaigns to existing leads queued

### Post-Launch (Week 1)
- [ ] Daily monitoring of conversion funnel
- [ ] User feedback collection (surveys, interviews)
- [ ] Bug triage and hotfixes
- [ ] Performance optimization based on real traffic
- [ ] Sales team feedback loop established

---

## 14. Future Enhancements (Post-MVP)

### Phase 2 Enhancements (3-6 months post-launch)
1. **Multi-User Sandbox**: Allow teams to explore together (collaborative demo)
2. **Industry-Specific Scenarios**: Autism services, mental health, HCBS waiver-specific demos
3. **AI-Powered Guide**: Chatbot assistant to answer questions during demo
4. **Video Overlay**: Short video clips embedded in tour steps
5. **Comparison Mode**: Side-by-side view of "old way" vs. "Referra way"

### Phase 3 Enhancements (6-12 months post-launch)
6. **Custom Sandbox**: Let org admins configure demo with their specific needs
7. **White-Label Demos**: Branded demos for enterprise prospects
8. **Advanced Analytics**: Predictive lead scoring using ML
9. **Sandbox API**: Let sales team programmatically create demos for prospects
10. **Certification Program**: Formal training with sandbox-based assessments

---

## 15. Appendix

### A. Dummy Data Examples

**Sample Client Record (Micro Tier)**:
```json
{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "age": 34,
  "service_needs": "ARMHS - Anxiety and depression management",
  "status": "Active-Stable",
  "urgency": "medium",
  "provider": "Mindful Wellness Services",
  "last_update": "3 days ago",
  "notes": "Sarah has been making great progress. Weekly check-ins going well."
}
```

**Sample Referral (Enterprise Tier)**:
```json
{
  "client": "David Martinez",
  "service_type": "245D Residential Services",
  "status": "Provider Matched",
  "provider": "Independence Plus",
  "created_date": "5 days ago",
  "urgency": "high",
  "notes": "Complex autism case requiring 24/7 support. Need provider with ABA experience."
}
```

### B. Tour Script Examples

**Case Manager Tour - Step 3 (Review Client Details)**:
```
Title: "Explore Client Information"

Body: "Everything you need to know about Sarah is right here. 
Click through the tabs to see her timeline, tasks, and communications with providers. 
This is your command center for each client."

Highlight: Client drawer tabs (Overview, Timeline, Tasks, Communications, Connections)

CTA: "Got it, next step →"
```

**Org Admin Tour - Step 5 (Client Oversight)**:
```
Title: "Organizational Client Oversight"

Body: "As an Org Admin, you can see ALL clients across your entire organization. 
Use this view for audits, compliance reports, and strategic planning. 
Your supervisors and case managers each see only their assigned clients."

Highlight: /org-admin/clients page with filter options

CTA: "Makes sense! →"
```

### C. Challenge Scenario - Detailed Example

**"Quick Match Challenge" (Case Manager)**:

**Setup**:
- Pre-populate a client "Emma Thompson" with urgent autism service needs
- Timer starts when challenge begins (3-minute countdown)
- Hints available at 1 min, 2 min, 2.5 min marks

**Instructions**:
"Emma needs autism support services URGENTLY - her current provider just closed. 
Create and submit a referral in under 3 minutes. Ready? GO!"

**Success Criteria**:
- Navigate to /case-manager/new-referral
- Select Emma Thompson
- Choose "Autism Support" service type
- Set urgency to "High"
- Submit referral
- Complete within 180 seconds

**Hint 1**: "Look for the 'New Referral' button in your navigation"  
**Hint 2**: "Make sure to set the urgency level to 'High'"  
**Hint 3**: "All required fields are marked with a red asterisk (*)"

**Success Message**:
"🎉 Amazing! You created Emma's referral in [actual time]. 
In a real scenario, providers would be notified immediately and could respond within hours. 
That's the power of Referra!"

**Failure Message**:
"Time's up! Don't worry - speed comes with practice. 
In the real platform, you won't have time pressure. Want to try again?"

---

## 16. Glossary

**Sandbox**: Isolated demo environment with dummy data for evaluation purposes  
**Guided Tour**: Step-by-step interactive walkthrough of key features  
**Challenge Scenario**: Gamified task to increase engagement and demonstrate value  
**Conversion**: Process of transitioning from sandbox to production account  
**BAA**: Business Associate Agreement (HIPAA compliance requirement)  
**Lead Score**: Numeric value indicating prospect's likelihood to convert  
**Tier**: Organization size category (Micro, Mid, Enterprise)  
**Dummy Data**: Realistic but fake data used in sandbox for demonstration  
**Tour Step**: Individual instruction in the guided tour sequence  
**Spotlight Effect**: Visual highlight drawing attention to specific UI element  

---

**END OF PRD**

**Document Version**: 1.0  
**Created**: [Current Date]  
**Author**: Product Team (Based on stakeholder requirements)  
**Status**: Ready for Review  
**Next Steps**: Stakeholder approval → Generate task list → Begin implementation

