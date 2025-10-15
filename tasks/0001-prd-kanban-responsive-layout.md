# PRD: Production-Grade Responsive Kanban Board Layout

## Introduction/Overview

The current Kanban board implementation uses fixed pixel widths and CSS calc() expressions that break at different browser zoom levels, causing column headers to be cut off, card information to become unreadable, and requiring users to manually zoom their browser to 65% to see content properly. This creates a poor user experience and is not production-ready.

**Problem**: Fixed-width layouts don't scale properly across different screen sizes, zoom levels, or viewport configurations.

**Goal**: Implement a world-class, zoom-level-agnostic Kanban board layout that works flawlessly at any browser zoom (25%-500%), on any screen size, and with any side panel configuration.

## Goals

1. **Zoom-Level Resilience**: Board works perfectly from 25% to 500% browser zoom
2. **Fluid Responsive Layout**: Columns and panels adapt smoothly to any viewport size
3. **Readable Content**: Card information remains readable at all zoom levels
4. **Professional Polish**: Column headers always aligned, no cut-off content
5. **Maintainable Code**: Simple, modern CSS that's easy to understand and modify
6. **Performance**: Smooth transitions and interactions with no jank

## User Stories

### Case Manager - Primary User
**As a case manager**, I want to:
- View my Kanban board at any browser zoom level without content breaking
- Have column headers always visible and aligned with their columns
- Read client card details without squinting or zooming
- Open the side drawer/panel without breaking the board layout
- Switch between different devices (laptop, external monitor) seamlessly
- Resize my browser window and have everything adapt properly

### Supervisor - Dashboard User
**As a supervisor**, I want to:
- View team dashboards on large monitors without wasted space
- See all columns and details clearly without manual browser zooming
- Have consistent layouts across my team's different screen setups

## Functional Requirements

### 1. Fluid Grid Layout
- Use CSS Grid with `fr` units instead of fixed pixel widths
- Columns divide available space equally (6 columns = `1fr` each)
- Minimum column width enforced to prevent over-compression
- Maximum column width to prevent over-expansion on large screens

### 2. Responsive Right Panel
- Panel width as percentage of viewport, not fixed pixels
- Panel slides in/out without affecting main board layout
- Board columns automatically adjust when panel opens/closes
- Smooth transitions (300-500ms) for panel state changes

### 3. Zoom-Level Agnostic Spacing
- Use `rem` units for all spacing (margins, padding, gaps)
- Use `em` units for component-relative sizing
- CSS variables for consistent spacing throughout
- Scale factors apply uniformly across all zoom levels

### 4. Column Header Alignment
- Headers always stay above their respective columns
- Header widths match column widths exactly
- Sticky positioning for headers during scroll (optional)
- Text truncation with ellipsis for long titles

### 5. Card Content Adaptivity
- Card text uses relative units (rem/em)
- Line clamping for long text with "show more" affordance
- Icon sizes scale with text
- Minimum card height to prevent over-compression
- Proper text wrapping, no horizontal overflow

### 6. Overflow Handling
- Horizontal: No horizontal scroll on board container
- Vertical: Each column scrolls independently
- Scrollbar styling consistent across browsers
- Touch-friendly scrolling on mobile devices

### 7. Viewport Breakpoints
- **< 1024px**: Reduce to 4 visible columns, horizontal scroll for others
- **1024px - 1440px**: 5-6 columns comfortable
- **1441px - 1920px**: 6 columns standard
- **> 1920px**: 6 columns with increased max-width

### 8. Performance Optimization
- Use CSS transforms for animations (GPU acceleration)
- Debounce resize handlers
- Virtual scrolling for columns with 50+ cards (optional)
- Memoize column components to prevent unnecessary re-renders

## Non-Goals (Out of Scope)

- ❌ Changing the drag-and-drop library (keep @dnd-kit)
- ❌ Redesigning the visual design/colors/styling
- ❌ Adding new Kanban features (filters, search, etc.)
- ❌ Mobile app version (focus on web browser)
- ❌ Changing the data structure or API
- ❌ Accessibility improvements beyond layout (separate PRD)

## Design Considerations

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                      Top Navigation Bar                      │ Fixed height: 80px
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────┬──────────────────┐   │
│  │                                   │                  │   │
│  │        Kanban Board               │   Right Panel    │   │
│  │   (CSS Grid: auto columns)        │  (30% of width)  │   │
│  │                                   │   (when open)    │   │
│  │  ┌────┬────┬────┬────┬────┬────┐ │                  │   │
│  │  │ C1 │ C2 │ C3 │ C4 │ C5 │ C6 │ │  Drawer content  │   │
│  │  ├────┼────┼────┼────┼────┼────┤ │     slides in    │   │
│  │  │    │    │    │    │    │    │ │      from right  │   │
│  │  │    │    │    │    │    │    │ │                  │   │
│  │  │    │    │    │    │    │    │ │                  │   │
│  │  └────┴────┴────┴────┴────┴────┘ │                  │   │
│  │                                   │                  │   │
│  └───────────────────────────────────┴──────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### CSS Architecture
- **CSS Grid** for main layout
- **Flexbox** for column internals
- **CSS Custom Properties** for theming and spacing
- **Container Queries** for card responsiveness (with fallback)
- **Logical Properties** for better internationalization

### Spacing System
```css
--space-xs: 0.25rem;   /* 4px at 100% zoom */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
```

### Component Sizing
- **Column min-width**: `12rem` (192px at 100%)
- **Column max-width**: `24rem` (384px at 100%)
- **Card min-height**: `4rem` (64px at 100%)
- **Panel width**: `clamp(20rem, 30vw, 40rem)` - fluid between min and max

## Technical Considerations

### Implementation Approach
1. **Phase 1**: Refactor main layout container to use CSS Grid
2. **Phase 2**: Convert all px units to rem/em with CSS variables
3. **Phase 3**: Implement fluid right panel with transitions
4. **Phase 4**: Test at multiple zoom levels (25%, 50%, 75%, 100%, 125%, 150%, 200%)
5. **Phase 5**: Add responsive breakpoints for smaller screens
6. **Phase 6**: Optimize performance and animations

### Key Technologies
- **CSS Grid Layout** - Modern, flexible grid system
- **CSS Custom Properties** - Dynamic theming and scaling
- **CSS `clamp()`** - Fluid typography and spacing
- **`rem` units** - Zoom-level resilient sizing
- **`useResizeObserver`** hook - Track container size changes
- **CSS `container` queries** - Responsive cards (progressive enhancement)

### Compatibility
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **CSS Grid**: Fully supported
- **Container Queries**: Supported in modern browsers, graceful degradation
- **CSS Variables**: Fully supported

### Migration Strategy
- Backward compatible - no breaking changes to component APIs
- Update `BoardView.tsx` layout structure
- Create new CSS module: `kanban-layout.module.css`
- Extract magic numbers to CSS variables
- Update responsive hook to use relative units

## Success Metrics

### Quantitative
1. **Zero layout breaks** from 25% to 500% browser zoom
2. **< 16ms** frame time during panel transitions (60fps)
3. **100% column header alignment** at all zoom levels
4. **Zero horizontal scroll** on board container (except intentional mobile)
5. **< 100ms** resize debounce response time

### Qualitative
1. Users no longer need to manually zoom browser
2. Board looks professional on any screen size
3. Developers can easily modify layout without breaking it
4. QA team approves layout across all test configurations
5. No user complaints about "cut off" or "too small" content

### Testing Criteria
- ✅ Test at 25%, 50%, 67%, 75%, 80%, 90%, 100%, 110%, 125%, 150%, 175%, 200%, 300%, 500% zoom
- ✅ Test on 13" laptop, 15" laptop, 24" monitor, 27" monitor, 32" ultrawide
- ✅ Test with panel closed, panel with drawer open, panel with details open
- ✅ Test column header alignment at all zoom levels
- ✅ Test card readability at all zoom levels
- ✅ Test smooth transitions when opening/closing panel
- ✅ Test drag-and-drop still works smoothly
- ✅ Test with 0 clients, 5 clients, 50 clients, 200 clients per column

## Open Questions

1. **Should we support horizontal scrolling for mobile?** 
   - Yes, allow horizontal swipe on < 1024px viewports

2. **What's the minimum supported screen width?**
   - 320px (iPhone SE) - show 2 columns with horizontal scroll

3. **Should column headers be sticky?**
   - Yes, but as enhancement in Phase 2 (not MVP)

4. **Do we need to persist panel width preference?**
   - No for MVP, could add in future

5. **Should we animate column width changes?**
   - Yes, subtle 300ms transition for professional feel

6. **What happens with 100+ cards in a column?**
   - Virtual scrolling (optional optimization), but lazy-load cards after 50

## Dependencies

- No new npm packages required
- Existing `@dnd-kit` library continues to work
- Existing `useResponsiveKanban` hook will be refactored
- CSS modules or styled-components (use existing pattern)

## Timeline Estimate

- **Phase 1-2**: 4-6 hours (Layout refactor + unit conversion)
- **Phase 3**: 2-3 hours (Panel transitions)
- **Phase 4**: 3-4 hours (Testing at all zoom levels + bug fixes)
- **Phase 5**: 2-3 hours (Responsive breakpoints)
- **Phase 6**: 1-2 hours (Performance optimization)

**Total**: 12-18 hours of focused development

## Priority

**🔥 HIGH PRIORITY** - This is a UX blocker affecting daily user experience. Current workaround (zoom to 65%) is unacceptable for production.

---

**Status**: ✅ Ready for Task Generation
**Created**: October 13, 2025
**Owner**: Engineering Team
**Platform**: Referra - Case Manager Dashboard

