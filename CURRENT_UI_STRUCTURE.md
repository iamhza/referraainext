# 🎨 Current UI Structure - Complete Reference

## Overview
Referra uses a modern Kanban board interface with slide-out drawers and panels. **No workspace messages** - all communication happens in the **Service Feed** tab inside client drawers.

---

## 🏗️ Component Hierarchy

```
BoardView (Main Dashboard)
  ├── DroppableColumn (x6 - status columns)
  │   ├── SortableClientCard (drag-and-drop cards)
  │   └── ColumnHeader
  │
  ├── ClientSideDrawer (slides in from right when card clicked)
  │   ├── DrawerHeader (client name, status, contact)
  │   ├── DrawerTabs (5 tabs)
  │   │   ├── Overview Tab
  │   │   ├── Referrals Tab
  │   │   ├── Timeline Tab
  │   │   ├── **Service Feed Tab** ⭐ (THE KEY TAB!)
  │   │   └── Documents Tab
  │   └── DrawerBody (tab content)
  │
  ├── ReferralPanel (slides in when "Create Referral" clicked)
  │   └── ReferralFormPanel
  │
  ├── AddClientModal
  └── DeleteClientModal
```

---

## 📋 Detailed Component Breakdown

### **1. BoardView (Main Kanban Board)**
- **6 Status Columns**:
  1. Unplaced
  2. Referral Sent
  3. In Process
  4. Active (Stable)
  5. Needs Attention
  6. Closed/Discharged

- **Client Cards** (SortableClientCard):
  - Client name, status dot
  - Primary contact (phone/email)
  - PMI number
  - Service types
  - Waiver type
  - Provider connections
  - Referral counts
  - "Create Referral" button
  - Delete button (hover)
  
- **Drag & Drop**:
  - Drag cards between columns to change status
  - Reorder within same column
  - Real-time optimistic updates

- **Empty State**: "No clients" message

---

### **2. ClientSideDrawer** (slides in from right, 850px wide)

#### **Header**:
- Client name (bold, large)
- Status badge (colored)
- Primary contact info
- Close button (X)
- Quick action buttons

#### **5 Tabs**:

##### **Tab 1: Overview**
- Client details section
- Connection status
- Provider info
- "Connect Provider" button
- "View Full Profile" button

##### **Tab 2: Referrals**
- List of all referrals for this client
- Each referral shows:
  - Service type
  - Provider name
  - Status (pending, accepted, rejected)
  - Date created
- Click referral → Opens ReferralDetailsPanel
- "View in Service Feed" button → Jumps to Service Feed tab

##### **Tab 3: Timeline**
- Chronological activity log
- Shows all events for this client

##### **Tab 4: Service Feed** ⭐ **THE ACTIONS LIBRARY!**

**This is where all the magic happens!**

**Structure**:

1. **Context Switcher** (top of feed)
   - Dropdown to select which referral/connection to post to
   - Shows: "Posting to: [Service Type] • [Provider Name]"
   - Groups by Referrals and Connections

2. **Composer** (sticky at top)
   - **Two modes**:
     - **Comment mode**: Write comments, @mention team
     - **Action mode**: Create workflow actions
   - User avatar
   - Mode toggle buttons
   - "Attach" button
   - "Comment" or "Create Action" button

3. **Timeline** (scrollable feed)
   - **Date separators**: "TODAY", "YESTERDAY", day names, dates
   - **Three event types**:
     - **Comments**: Text updates with avatar, timestamp, replies
     - **Actions**: Task cards with:
       - Title, description
       - Status badge (pending/in_progress/complete)
       - Urgency indicator (urgent/high/normal)
       - Target date
       - Service context (which referral)
       - "Mark Complete" button
       - Comment thread
     - **Status Changes**: System-generated events

4. **Add Action Modal** (opens from composer)
   - Action title
   - Description
   - Type (follow_up, provider_update, client_check_in, etc.)
   - Urgency level
   - Target date
   - Assigned user
   - Context (which referral/connection)

**Empty State**: "No activity yet" with "Create First Action" button

##### **Tab 5: Documents**
- File upload/management
- Document list

---

### **3. ReferralPanel** (slides in from right, same position as drawer)

When user clicks "Create Referral":
1. Drawer closes (or stays behind)
2. ReferralPanel slides in
3. Shows referral form:
   - Client context card (pre-filled)
   - Service type selector
   - Provider search
   - Referral details
   - "Submit Referral" button
4. On success → Shows celebration animation → Auto-closes

---

## 🎯 Key User Workflows

### **Workflow 1: Create a Referral**
```
1. User is on BoardView
2. Click client card
3. ClientSideDrawer opens (Overview tab)
4. Click "Create Referral" button (or use Service Feed)
5. ReferralPanel slides in
6. Fill form → Submit
7. Success! Panel closes, client status updates
```

### **Workflow 2: Manage Referral Actions**
```
1. User is on BoardView
2. Click client card
3. ClientSideDrawer opens
4. Click "Service Feed" tab
5. Select referral from Context Switcher
6. See timeline of all actions/comments for that referral
7. Click "Action" mode in composer
8. Click "Create Action" button
9. AddActionModal opens
10. Fill action details → Create
11. Action appears in timeline
12. Later: Mark action complete
```

### **Workflow 3: Drag & Drop Status Change**
```
1. User is on BoardView
2. Drag client card from "Unplaced" column
3. Drop in "Referral Sent" column
4. Optimistic update → Card moves immediately
5. Backend confirms → Status saved
6. Timeline event created automatically
```

### **Workflow 4: View Full Client Timeline**
```
1. Click client card
2. ClientSideDrawer opens
3. Click "Service Feed" tab
4. See ALL activity for this client across ALL referrals/connections
5. Use Context Switcher to filter by specific referral
```

---

## 🎨 Design Language

### **Colors**:
- **Unplaced**: Red/Slate (urgent)
- **Referral Sent**: Blue (in progress)
- **In Process**: Purple (pending)
- **Active Stable**: Green (good)
- **Needs Attention**: Yellow/Amber (warning)
- **Closed**: Gray (done)

### **Spacing**:
- Card padding: `var(--card-padding)`
- Card gap: `var(--card-gap)`
- Card min height: `var(--card-min-height)`

### **Typography**:
- Card titles: 13px (compact), 15px (comfortable)
- Card details: 10px (compact), 12px (comfortable)
- Drawer headers: 16px bold
- Tab labels: 14px

### **Animations**:
- Drawer slide: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Panel slide: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Card hover: 200ms ease
- Drag overlay: 150ms ease-out

---

## 🔑 Key Data Selectors (for Tour)

### **BoardView**:
- Kanban board: `.kanban-board-container`
- Column: `.droppable-column`
- Client card: `.client-card` or `[data-client-id]`
- Add client button: `button` with "Add client" text

### **ClientSideDrawer**:
- Drawer container: Positioned absolute right 0
- Close button: `X` icon button in header
- Tab buttons: `[data-tab="overview"]`, `[data-tab="referrals"]`, etc.

### **Service Feed**:
- Context switcher: `.context-switcher` or Select component
- Composer: `.service-feed-composer`
- Mode toggle: Comment/Action buttons
- Timeline: `.timeline-event`
- Action card: `.action-card`
- "Create Action" button: Button with "Create Action" text

### **ReferralPanel**:
- Panel container: Positioned fixed right 0, top 80px
- Client context card: `.client-context-card`
- Submit button: Button with "Submit Referral" text

---

## 🚨 Important Notes for Tour

1. **NO "Workspace Messages"** - Use "Service Feed" instead
2. **Actions Library = Service Feed Tab** in the drawer
3. **Context is key** - Service feed shows different content based on selected referral/connection
4. **Drawer stays open** when creating referral (panel overlays)
5. **Service Feed is PER CLIENT** - Each client has their own feed
6. **Referrals drive the feed** - Most actions are tied to specific referrals
7. **Timeline is automatic** - Status changes, comments, actions all appear chronologically

---

## 📱 Responsive Behavior

### **Mobile** (< 768px):
- Board switches to list view (SortableClientListItem)
- Drawer takes full screen
- Panels stack vertically

### **Tablet** (768px - 1024px):
- Board shows 3-4 columns at once (horizontal scroll)
- Drawer width: 60% screen
- Compact card view

### **Desktop** (> 1024px):
- Board shows all 6 columns
- Drawer width: 850px fixed
- Comfortable card view
- All features fully accessible

---

**This is the ACTUAL current UI that the tour must reflect!** 🎯

