# PRD: Smart Status System for Dynamic Board

## Introduction

Transform the static Kanban board into an intelligent, priority-driven workload management system by surfacing urgent actions from the actions library directly on client cards, auto-sorting by urgency, and providing smart filtering—all while maintaining the familiar 6-column structure.

**Problem:** Critical client issues are hidden in "stable" columns, requiring manual inspection of 40+ cards to find urgent items. Multi-service clients show cryptic badges that don't communicate what needs action or when.

**Solution:** Compute a single, contextual status bar for each client from the actions library, auto-sort cards by urgency within columns, and provide smart filters that work across the entire board.

## Goals

1. **Immediate Visibility:** Urgent items surface at top of each column automatically
2. **Clear Communication:** Status bars use plain language ("FOLLOW-UP OVERDUE") not cryptic icons
3. **Zero Manual Sorting:** Cards auto-arrange by priority within columns
4. **Smart Filtering:** Find all urgent clients across entire board with one click
5. **No Visual Chaos:** One status bar per card (most urgent action only)
6. **Maintained Workflow:** Preserve existing 6-column structure and drag-and-drop

## User Stories

### Case Manager - Morning Triage

**As a case manager**, I want to immediately see which clients need urgent attention when I open the board, so I can prioritize my day without clicking through 40 cards.

**Acceptance Criteria:**
- Cards with urgent actions automatically appear at top of their column
- Status bar shows clear action needed ("FOLLOW-UP OVERDUE - 2 days")
- Color coding indicates severity (red = overdue, orange = due soon)
- I can complete the action and status bar disappears

### Case Manager - Finding All Documentation Needs

**As a case manager**, I want to find all clients who need documentation across the entire board, regardless of which column they're in.

**Acceptance Criteria:**
- Click "NEEDS DOCS" filter shows all clients requiring documentation
- Works across all columns (finds clients in Active, Referral Sent, etc.)
- Count shows how many clients match before I click
- Clear filter returns to full board view

### Case Manager - Understanding Multi-Service Clients

**As a case manager**, I want to see which specific service needs attention for clients with multiple services.

**Acceptance Criteria:**
- Status bar specifies service type ("DOC NEEDED - Meals service")
- Card shows all services with individual status indicators
- Most urgent service determines card priority
- I can click to see full service breakdown

### Supervisor - Weekly Review

**As a supervisor**, I want to see which clients haven't had activity in 30+ days during team review meetings.

**Acceptance Criteria:**
- "NO ACTIVITY" filter shows stale clients
- Cards show last activity date
- Works in both comfortable and compact view
- Can export list for follow-up planning

## Functional Requirements

### 1. Smart Status Computation (Backend)

**Data Source:** Actions library (`/api/clients/[id]/actions`)

**Computation Logic:**
```
For each client:
1. Fetch all pending actions
2. Find highest priority action:
   - Critical + overdue = highest
   - High + overdue = second
   - High + due today = third
   - Normal + pending = lowest
3. Generate status text from action type:
   - request_status_update → "FOLLOW-UP NEEDED"
   - request_documentation → "DOC NEEDED"
   - flag_concern → "ISSUE FLAGGED"
   - request_intake_date → "INTAKE PENDING"
4. Calculate time context:
   - Overdue: "OVERDUE - X days"
   - Due today: "Due today"
   - Due this week: "In X days"
5. Return smartStatus object or null
```

**API Response Enhancement:**
```json
{
  "_id": "client123",
  "firstName": "John",
  "lastName": "Smith",
  "status": "ACTIVE_STABLE",
  "smartStatus": {
    "text": "FOLLOW-UP OVERDUE",
    "subtext": "2 days",
    "color": "red",
    "urgencyScore": 85,
    "actionId": "action456",
    "actionType": "request_status_update",
    "serviceContext": "housing",
    "dueDate": "2025-10-13T00:00:00Z"
  }
}
```

### 2. Status Bar Component (Frontend)

**Visual Specifications:**
- Height: 40px (comfortable), 28px (compact)
- Left border: 4px colored bar (red/orange/yellow)
- Typography: 13px medium weight, 11px light for subtext
- Spacing: 12px padding horizontal, 8px vertical
- Border radius: 6px
- Background opacity: 10% of border color

**Color System:**
- Red (Critical/Overdue): `#DC2626` (red-600)
- Orange (High/Due Soon): `#EA580C` (orange-600)
- Yellow (Normal/Pending): `#CA8A04` (yellow-600)
- Gray (Info): `#6B7280` (gray-500)

**States:**
- Default: Border + background
- Hover: Increase background opacity to 15%, show tooltip
- Compact view: Show only colored bar, tooltip on hover

### 3. Auto-Sorting Within Columns

**Sort Priority (descending):**
1. Urgency score (0-100)
2. Due date (earliest first)
3. Updated date (most recent first)
4. Alphabetical (last name)

**Implementation:**
- Sort runs client-side after data fetch
- Maintains sort when filters applied
- Preserves sort after drag-and-drop (re-sorts on next refresh)
- Smooth CSS transitions when cards reorder

### 4. Smart Filter Bar

**Filter Options:**
| Filter | Query | Badge Color |
|--------|-------|-------------|
| OVERDUE | urgencyScore > 80 | Red |
| DUE TODAY | dueDate = today | Orange |
| THIS WEEK | dueDate within 7 days | Orange |
| NEEDS DOCS | actionType = request_documentation | Blue |
| NO ACTIVITY | updatedAt > 30 days ago | Gray |
| ALL CLIENTS | No filter | Default |

**Visual Design:**
- Pill-shaped buttons with counts
- Active filter has filled background
- Smooth transitions when filtering
- Keyboard shortcuts (1-6 for each filter)

### 5. Grouping Modes (Optional Enhancement)

**Default:** Group by Status (current 6 columns)

**Alternative Modes:**
- **Group by Service:** Columns become service types (Housing, Meals, Transport, etc.)
- **Group by Urgency:** Columns become urgency levels (Critical, High, Normal, Stable)
- **Group by Provider:** Columns become provider names

**Column Assignment Logic:**
- Service mode: Card placed in column of most urgent service
- Urgency mode: Card placed by urgency score range
- Provider mode: Card placed by primary provider relationship

### 6. Priority Panel (Top of Board)

**Layout:** Full-width banner above board

**Content:**
- Client name
- Urgent action description
- Due date with visual countdown
- Quick action buttons (Complete, Remind, View)

**Behavior:**
- Shows ONLY the single most urgent action across entire board
- Dismissing reveals next urgent action
- Empty state: "All caught up! No urgent items."

### 7. Responsive Behavior

**Desktop (1440px+):**
- Full status bar with text
- All 6 columns visible
- Comfortable spacing

**Laptop (1024-1439px):**
- Condensed status bar
- All 6 columns, tighter spacing
- Horizontal scroll if needed

**Tablet (768-1023px):**
- Compact cards
- 4 columns visible, horizontal scroll
- Abbreviated status text

**Mobile (< 768px):**
- List view (not board)
- One column, vertical scroll
- Full status bars

## Non-Goals

- Changing the 6-column structure
- Adding new action types to actions library
- Redesigning the client drawer
- Modifying drag-and-drop behavior
- Building a separate triage view (that's the POC)

## Design Specifications

### Typography Scale
```css
--text-xs: 0.6875rem;    /* 11px - subtext */
--text-sm: 0.8125rem;    /* 13px - status bar */
--text-base: 0.875rem;   /* 14px - card body */
--text-lg: 1rem;         /* 16px - card title */
```

### Spacing Scale
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
```

### Color Palette
```css
--red-50: #FEF2F2;
--red-600: #DC2626;
--orange-50: #FFF7ED;
--orange-600: #EA580C;
--yellow-50: #FEFCE8;
--yellow-600: #CA8A04;
--gray-50: #F9FAFB;
--gray-500: #6B7280;
--gray-900: #111827;
```

### Animation Timing
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

## Technical Considerations

### Performance
- Compute smart status server-side (not client-side for 40+ clients)
- Cache urgency scores with 5-minute TTL
- Debounce filter changes (200ms)
- Virtual scroll for columns with 50+ cards
- Memoize sort functions

### Data Flow
```
1. User loads board
2. API fetches clients + actions in parallel
3. Server computes smartStatus for each client
4. Client receives enhanced data
5. BoardView auto-sorts within columns
6. Cards render with status bars
7. Filters query enhanced data
```

### Edge Case Handling

**No Pending Actions:**
- smartStatus = null
- No status bar renders
- Card shows "All services stable" in gray text

**Multiple Urgent Actions:**
- Show highest priority only
- Card footer shows "+ 2 other actions"
- Click reveals all actions in drawer

**Stale Data:**
- Status computed fresh on every board load
- No client-side caching of status
- Optimistic updates when action completed

**Drag and Drop:**
- Status bar is read-only (not draggable element)
- Dragging card doesn't change status
- Status recomputes after drop if column changes

## Success Metrics

### Quantitative
1. **Time to Find Urgent Items:** < 5 seconds (down from 30+ seconds)
2. **Cards Requiring Click to Understand:** 0 (down from 100%)
3. **Urgent Items Missed:** 0% (currently ~15% reported)
4. **Filter Usage:** 60%+ of sessions use at least one filter
5. **Auto-Sort Accuracy:** 100% (urgent items always at top)

### Qualitative
1. Case managers report "knowing what to do" without training
2. No complaints about "visual noise" or "too much color"
3. Supervisors can scan board and understand status in < 30 seconds
4. New users understand status bars without explanation
5. Compact view maintains usability

## Testing Strategy

### Unit Tests
- `computeSmartStatus()` with various action combinations
- Sort algorithm with edge cases (ties, nulls, missing data)
- Filter logic with overlapping criteria
- Color assignment for all urgency levels

### Integration Tests
- API returns correctly formatted smartStatus
- Status bar renders for all action types
- Filters work across all columns
- Sorting persists after page refresh

### E2E Tests (Playwright)
```
Scenario: Morning triage workflow
1. Login as case manager
2. Board loads, urgent cards appear at top
3. Click "OVERDUE" filter
4. Verify only overdue clients visible
5. Click first card status bar
6. Complete action from drawer
7. Verify status bar disappears
8. Verify next urgent card floats to top
```

### Visual Regression Tests
- Status bar appearance at all urgency levels
- Card sorting order with various data sets
- Filter bar states (active, inactive, hover)
- Responsive breakpoints (desktop, tablet, mobile)
- Compact vs comfortable view

## Implementation Plan

### Phase 1: Backend (Days 1-2)
- Add `computeSmartStatus()` function
- Enhance `/api/clients` response
- Add urgency scoring logic
- Cache computed statuses

### Phase 2: Core UI (Days 3-4)
- Create `SmartStatusBar` component
- Add auto-sort to `BoardView`
- Update `ClientCard` component
- Test across urgency levels

### Phase 3: Filters (Day 5)
- Create `FilterBar` component
- Wire up filter logic to board
- Add keyboard shortcuts
- Test filter combinations

### Phase 4: Priority Panel (Day 6)
- Create `PriorityPanel` component
- Wire up action completion
- Add smooth transitions
- Test empty states

### Phase 5: Polish (Day 7)
- Responsive testing
- Animation tuning
- Accessibility audit
- Performance optimization

### Phase 6: User Testing (Day 8)
- Deploy to staging
- Test with real case managers
- Gather feedback
- Make adjustments

## Dependencies

- Existing actions library (no changes needed)
- Current 6-column board structure
- Client drawer component
- SWR for data fetching

## Open Questions

1. **Should status bars be clickable to quick-complete actions?**
   - Leaning yes, with confirmation modal

2. **What happens if action is deleted but status cached?**
   - Use optimistic updates + fresh fetch on mismatch

3. **Should we show service context for all actions or only multi-service clients?**
   - Only when ambiguous (multiple services with issues)

4. **Compact view: colored bar only or include truncated text?**
   - Colored bar + first 20 characters + ellipsis

## Priority

**HIGH** - Solves critical UX issues preventing case managers from finding urgent items efficiently

---

**Status:** Ready for Implementation  
**Created:** October 15, 2025  
**Owner:** Engineering Team  
**Estimated Effort:** 8 days (1 engineer)  
**Target Release:** Sprint 24 (October 2025)

