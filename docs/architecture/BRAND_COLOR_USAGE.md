# Referra Brand Color Usage Guide

## Color Palette & Semantic Usage

| Color | Hex | Semantic Meaning | Usage |
|-------|-----|------------------|-------|
| **Primary Blue** | `#0040FF` | Primary/Brand | Primary actions, links, interactive elements, gradients |
| **Critical Dark Red** | `#991B1B` | Critical/Severe | Expired authorizations, critical errors (darker for emphasis) |
| **Danger Coral** | `#FA6563` | Negative/Denied | Denied authorizations, rejected states |
| **Warning Dark Orange** | `#D97706` | Warning/Attention | Active issues, items count (bold, attention-grabbing) |
| **Alert Yellow** | `#F2C94C` | Alert/Waiting | Pending start, waiting states |
| **Success Green** | `#4CB782` | Success/Active | Active services, approved auth, success states |
| **Info Blue** | `#4EA7FC` | Info/Pending | Pending submissions, informational, in-progress |
| **Special Purple** | `#BB87FC` | Special/Paused | Paused services, featured items |
| **Neutral Gray** | `#95A2B3` | Neutral/Inactive | Closed services, no issues, secondary text |
| **Caution Olive** | `#978200` | Reserved | Not currently used - available for future needs |

---

## Current Implementation in Table

### Service Status Column
- **Active**: Green (`#4CB782`) ✓
- **Pending Start**: Yellow (`#F2C94C`) ⏳
- **Paused**: Purple (`#BB87FC`) ⏸
- **Closed**: Gray (`#95A2B3`) ✕

### Authorization Column (Database Statuses)
- **Approved**: Green (`#4CB782`) ✓ - Success state
- **Pending (Submitted)**: Light Blue (`#4EA7FC`) ⏱ - Info/waiting state
- **Expired**: Dark Red (`#991B1B`) ✕ - Critical/severe state (darker for maximum emphasis)
- **Denied**: Coral (`#FA6563`) ⊘ - Negative/rejected state
- **Draft**: Gray (`#95A2B3`) 📝 - Incomplete/not submitted

**Note:** "Expiring soon" is NOT a status - it's a visual indicator shown on APPROVED authorizations that are within 30 days of expiration (displayed with orange warning color `#F2994A` on the individual service row).

### Issues Column
- **Has Issues**: Dark Orange (`#D97706`) ⚠️
- **No Issues**: Gray (`#95A2B3`)

### Client Row Badge
- **Client badge**: Premium gradient (`#0040FF` → `#4EA7FC`) with white text
  - Gradient background for premium feel
  - Border matches primary blue
  - Distinguishes parent rows from service rows

### Buttons
- **Items (X)** button: Dark Orange border/text (`#D97706`)
- **Raise Issue** button: Gray border/text (`#95A2B3`)

---

## Smart Color Strategy

### Semantic Color System
Colors are chosen based on **meaning**, not just aesthetics:

1. **Critical/Severe States** → Dark Red (`#991B1B`)
   - Expired authorizations, critical errors
   - Requires immediate attention
   - Darker red for maximum visual weight and urgency

2. **Negative/Denied States** → Coral (`#FA6563`)
   - Denied authorizations, rejected requests
   - Different shade from critical to distinguish denial vs expiration

3. **Warning/Attention States** → Dark Orange (`#D97706`)
   - Active issues, items count buttons
   - Needs attention but not critical yet
   - Bold, attention-grabbing for primary warnings

4. **Alert/Waiting States** → Yellow (`#F2C94C`)
   - Pending start, waiting for action
   - Informational alerts

5. **Info/Pending States** → Light Blue (`#4EA7FC`)
   - Pending submissions, in-progress items
   - Informational, no urgency

6. **Success/Active States** → Green (`#4CB782`)
   - Active services, approved authorizations
   - Positive, healthy states

7. **Special States** → Purple (`#BB87FC`)
   - Paused services (temporary hold)
   - Neither positive nor negative

8. **Neutral/Inactive States** → Gray (`#95A2B3`)
   - Closed services, no issues
   - Completed or inactive items

### Visual Hierarchy
- **Solid backgrounds** for badges (mixed statuses)
- **Colored text + icon** for single statuses (more subtle)
- **Border colors** match the main status color
- **Hover states** use lighter tints of the same color

### Reserved Colors
- **Primary Blue** (`#0040FF`) - Brand/interactive elements only
- **Olive** (`#978200`) - Reserved for future semantic needs

---

## Future Expansion

The color system (`/src/lib/brand-colors.ts`) is ready for:
- Filter badges
- Status dropdowns
- Progress indicators
- Notification toasts
- Dashboard widgets
- Charts and graphs

All components can reference the centralized color definitions for consistency across the platform.

