# Triage Feed & Caseload Hub - Proof of Concept

## Overview

This is a working proof of concept implementing the **Triage Feed & Caseload Hub** design pattern as an alternative to the traditional Kanban board for case management.

## Access

- **URL**: `/case-manager/triage-feed`
- **Button**: Blue "⚡ Triage Feed POC" button in the top navigation bar
- **Test User**: miknabil@yahoo.com

## What's Implemented

### Left Panel: Caseload Hub
- **Client List** with health status indicators:
  - 🔴 Red: Urgent - Has overdue or urgent action items
  - 🟡 Yellow: Pending - Has upcoming or normal priority actions
  - 🟢 Green: Stable - No pending actions
  
- **Smart Filters**:
  - "🔴 Needs Action" - Shows only clients with pending actions
  - "All Clients" - Shows complete caseload
  - "Recently Updated" - Sorted by last update date
  
- **Search**: Real-time client search by name

### Right Panel: Dynamic Action Feed

#### Mode 1: Triage View (Default)
- Displays **all actionable items** across all clients in one prioritized feed
- Action types:
  - Referral follow-ups
  - Document needs (signatures, authorizations)
  - Service reviews
  - Provider responses
  - Compliance deadlines
  
- Each action card shows:
  - Priority level (Urgent/High/Normal)
  - Client name
  - Due date / Overdue status
  - Quick action buttons (Mark Complete, View Client, etc.)

#### Mode 2: Client-Specific View
- Click any client in the left panel to view their complete story
- Shows:
  - Client info with status
  - Active services
  - All current action items for that client
  - Complete timeline history (referrals, connections, notes, status changes)

## Mock Data

The POC includes **8 realistic mock clients** with:
- **Jane Doe** - 2 urgent actions (housing referral follow-up, IHP signature)
- **Mike Perez** - 1 urgent action (overdue transportation authorization)
- **Sarah Johnson** - 1 high priority action (6-month review due)
- **John Smith** - 1 normal priority action (provider update request)
- **Emily Rogers, David Lee, Lisa Brown** - Stable, no actions
- **Tom Wilson** - 1 high priority action (insurance reauthorization)

## Key Features Demonstrated

### 1. **Triage-First Workflow**
- All urgent items surface immediately regardless of client status
- No more "buried emergencies" in stable columns

### 2. **Context Switching**
- Seamlessly switch between "what needs doing" (action view) and "who needs help" (client view)
- One click to see a client's complete story

### 3. **Priority Visualization**
- Color-coded action cards (red/orange/blue for urgent/high/normal)
- Visual indicators on client list (status dots)
- Overdue tracking with day counts

### 4. **Actionable Interface**
- Quick action buttons directly on action cards
- No need to drill down multiple levels to complete tasks

### 5. **Timeline View**
- Chronological history for each client
- Different event types (referrals, connections, notes, documents)
- Relative timestamps ("3 days ago")

## Architecture

### Data Model
```typescript
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  status: 'urgent' | 'pending' | 'stable';  // Computed from actions
  activeServices: string[];
  lastUpdate: Date;
  actions: ActionItem[];
  timeline: TimelineEvent[];
}

interface ActionItem {
  type: 'referral_followup' | 'document_needed' | 'service_review' | 'provider_response' | 'deadline';
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  priority: 'urgent' | 'high' | 'normal';
  dueDate?: Date;
  overdueDays?: number;
}
```

### Computed Logic
- **Client status** is derived from their actions (not manually set)
- **Urgency** is calculated from due dates and priority levels
- **Timeline** aggregates all events chronologically

## Technical Implementation

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React useState and useMemo for performance
- **No Backend Calls**: Pure mock data for POC speed

## Comparison to Kanban Board

| Feature | Kanban Board | Triage Feed |
|---------|--------------|-------------|
| **Find urgent tasks** | Must scan all columns | Immediate at top |
| **Multi-service clients** | Single status column | Multi-indicator + action list |
| **Mental model** | "Where is client?" | "What needs doing?" |
| **Workload view** | Visual columns | Client count badges |
| **Context depth** | Panel per client | Timeline + full history |
| **Priority awareness** | Hidden in cards | Explicit action feed |

## User Testing Questions

When testing this POC, consider:

1. **Morning Workflow**: When you start your day, which view helps you identify priorities faster?
2. **Emergency Handling**: If a client has an urgent issue but is in "Active-Stable" services, is it easier to spot?
3. **Context Switching**: Is it intuitive to switch between "all actions" and "single client" views?
4. **Information Density**: Does the action feed feel overwhelming or helpful?
5. **Workload Awareness**: Can you still get a sense of overall caseload distribution?

## Next Steps for Production

If this pattern proves valuable in user testing:

1. **Connect to Real Data**
   - Replace mock data with API calls
   - Compute action items from referrals, connections, and deadlines
   - Real-time updates via SWR or React Query

2. **Action Completion**
   - Wire up "Mark Complete" to update database
   - Optimistic UI updates
   - Toast notifications

3. **Enhanced Filtering**
   - Filter by priority level
   - Filter by service type
   - Date range filters
   - Custom saved views

4. **Performance Optimization**
   - Virtual scrolling for large caseloads
   - Debounced search
   - Lazy load timeline events

5. **Mobile Responsiveness**
   - Stack panels vertically on mobile
   - Swipeable views
   - Bottom sheet for client details

6. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - Focus management

## Files Created

- `/src/app/case-manager/triage-feed/page.tsx` - Main POC page (630 lines)
- `/src/components/layout/CleanTopBar.tsx` - Added navigation button
- `/TRIAGE_FEED_POC.md` - This documentation

## Feedback & Iteration

This is a **proof of concept** to validate the UX pattern. It's meant to be:
- ✅ Quick to build and test
- ✅ Realistic enough to evaluate
- ✅ Easy to discard if users prefer the board

**Not meant to be**:
- ❌ Production-ready code
- ❌ Fully feature-complete
- ❌ Connected to real backend

## Credits

- Concept: Cofounder's vision for action-oriented case management
- Implementation: AI-assisted development
- Test Data: Realistic Minnesota DHS waiver scenarios

---

**Built**: October 14, 2025  
**Status**: Ready for user testing  
**Next**: Gather feedback from case managers at Thomas Allen/Accord

