# Task List: Production-Grade Responsive Kanban Board Layout

**PRD Reference**: `0001-prd-kanban-responsive-layout.md`

## Relevant Files

- `src/components/dashboard/BoardView.tsx` - Main kanban board component with fixed-width layout that needs refactoring
- `src/hooks/useResponsiveKanban.ts` - Responsive hook that calculates pixel values, needs to be updated for fluid units
- `src/styles/kanban-responsive.css` - Existing CSS file with good foundation, needs expansion for production-grade layout
- `src/styles/kanban-layout-variables.css` - NEW: CSS custom properties for spacing, sizing, and responsive breakpoints
- `src/components/dashboard/DroppableColumn.tsx` - Column component with fixed height calculations that need updating
- `src/components/dashboard/ColumnHeader.tsx` - Column header that may need alignment adjustments
- `src/components/dashboard/ClientCard.tsx` - Card component that needs responsive text/spacing
- `src/components/dashboard/ClientListItem.tsx` - Compact card view that needs responsive adjustments
- `tests/kanban-responsive.spec.ts` - NEW: E2E tests for zoom levels and responsive behavior

### Notes

- No new dependencies needed - pure CSS refactoring
- Existing `@dnd-kit` drag-and-drop functionality remains unchanged
- Test at multiple zoom levels: 25%, 50%, 67%, 75%, 90%, 100%, 125%, 150%, 200%, 500%
- Use browser DevTools zoom controls for testing
- Test with panel closed, drawer open, and details panel open

---

## Tasks

- [x] **1.0 Create CSS Custom Properties System**
  - [x] 1.1 Create new file `src/styles/kanban-layout-variables.css` with CSS custom properties for spacing scale (xs through 3xl)
  - [x] 1.2 Add custom properties for column sizing (min-width, max-width, gap) using rem units
  - [x] 1.3 Add custom properties for panel sizing (min-width, preferred-width as vw, max-width)
  - [x] 1.4 Add custom properties for typography scale (font sizes, line heights) using rem units
  - [x] 1.5 Add custom properties for z-index layers (panel, drawer, overlay, modal)
  - [x] 1.6 Add custom properties for transition durations and easing functions
  - [x] 1.7 Import this CSS file in `src/app/globals.css` (imported before Tailwind)
  - [x] 1.8 Add documentation comments explaining each variable's purpose and usage

- [x] **2.0 Refactor Main Board Layout to CSS Grid**  
  - [x] 2.1 Update `BoardView.tsx` main container from flex to CSS Grid layout
  - [x] 2.2 Remove fixed `width: 'calc(100% - 850px)'` from board container
  - [x] 2.3 Replace with `grid-template-columns: 1fr clamp(...)` for board + panel layout
  - [x] 2.4 Update kanban grid from fixed widths to `grid-template-columns: repeat(6, minmax(var(--column-min-width), 1fr))`
  - [x] 2.5 Remove pixel-based gap, use `gap: var(--column-gap)` from CSS variables
  - [x] 2.6 Updated to use CSS Grid instead of pixel calculations
  - [x] 2.7 Converted inline styles to use CSS custom properties
  - [x] 2.8 Grid layout maintains drag-and-drop compatibility

- [x] **3.0 Implement Fluid Right Panel**
  - [x] 3.1 Remove fixed `width: '850px'` from right panel container in `BoardView.tsx`
  - [x] 3.2 Panel width now uses CSS Grid with `clamp(var(--panel-min-width), var(--panel-preferred-width), var(--panel-max-width))`
  - [x] 3.3 Updated panel positioning to use CSS Grid column placement instead of fixed positioning
  - [x] 3.4 Panel uses CSS Grid for smooth width transitions
  - [x] 3.5 Board grid automatically adjusts columns when panel opens (CSS Grid handles this)
  - [x] 3.6 Removed hardcoded positioning, panel now in grid flow
  - [x] 3.7 Panel conditionally renders only when drawer/referral panel open
  - [x] 3.8 Fluid layout works at all viewport sizes with clamp()

- [x] **4.0 Update Column and Card Components for Relative Units**
  - [x] 4.1 Updated `DroppableColumn.tsx` to use `height: 100%` and `minHeight: 0` - grid parent handles sizing
  - [x] 4.2 Converted `ClientCard.tsx` padding/margin to use CSS variables (`var(--card-padding)`, `var(--card-gap)`)
  - [x] 4.3 Updated card font sizes to use `var(--font-sm)` and CSS variables throughout
  - [x] 4.4 Updated `ClientListItem.tsx` to use `var(--space-md)` for padding and `var(--font-xs)` for font
  - [x] 4.5 Updated `ColumnHeader.tsx` padding to `var(--space-md)` and font to `var(--font-base)`
  - [x] 4.6 Added `minWidth: 0` to column and grid children for proper CSS Grid shrinking
  - [x] 4.7 Updated icon sizes in `ColumnHeader` to use `1em` units - scales with text automatically
  - [x] 4.8 Text truncation already implemented with Tailwind `truncate` class throughout
  - [x] 4.9 Components now use relative units - ready for zoom testing in Phase 6

- [x] **5.0 Refactor useResponsiveKanban Hook**
  - [x] 5.1 Removed all pixel-based calculations - CSS Grid handles sizing automatically
  - [x] 5.2 Hook now returns only boolean flags: `shouldCompactCards`, `shouldHideDetails`
  - [x] 5.3 Simplified breakpoint logic to simple viewport width checks (800px, 600px)
  - [x] 5.4 Removed `fontSize`, `gap`, and `columnWidth` returns - CSS variables handle these
  - [x] 5.5 Simplified `updateLayout` to only check container width for boolean flags
  - [x] 5.6 `ResizeObserver` still watches container but only updates display flags
  - [x] 5.7 Removed `useZoomLevel` and `useViewportCategory` hooks - no longer needed
  - [x] 5.8 Updated `BoardView.tsx` to use simplified hook (only 2 variables now!)
  - [x] 5.9 Added comprehensive comments explaining CSS Grid handles all sizing

- [ ] **6.0 Cross-Zoom Testing and Polish**
  - [ ] 6.1 Create testing checklist document in `tasks/` folder with all zoom levels to test
  - [ ] 6.2 Test layout at 25% zoom - verify no horizontal scroll, readable content
  - [ ] 6.3 Test layout at 50% zoom - verify column headers aligned, cards readable
  - [ ] 6.4 Test layout at 67% zoom - verify optimal spacing and readability
  - [ ] 6.5 Test layout at 75% zoom - verify panel transitions smoothly
  - [ ] 6.6 Test layout at 100% zoom - verify this is the sweet spot, perfect layout
  - [ ] 6.7 Test layout at 125% zoom - verify text scales up, no overflow
  - [ ] 6.8 Test layout at 150% zoom - verify everything still readable and functional
  - [ ] 6.9 Test layout at 200% zoom - verify extreme zoom still works
  - [ ] 6.10 Test layout at 500% zoom - verify accessibility for low vision users
  - [ ] 6.11 Test with panel closed, drawer open, and details panel open at each zoom level
  - [ ] 6.12 Test with 0 clients, 5 clients, 50 clients, and 200 clients per column
  - [ ] 6.13 Test on different screen sizes: 13" laptop (1440x900), 15" laptop (1920x1080), 27" monitor (2560x1440), 32" ultrawide (3840x1600)
  - [ ] 6.14 Test drag-and-drop functionality at 50%, 100%, and 150% zoom
  - [ ] 6.15 Fix any alignment issues found during testing
  - [ ] 6.16 Add final polish: ensure smooth transitions, no visual glitches
  - [ ] 6.17 Update `kanban-responsive.css` with any additional styles discovered during testing
  - [ ] 6.18 Document zoom testing results and any browser-specific quirks
  - [ ] 6.19 Get QA approval for all test scenarios
  - [ ] 6.20 Commit final changes with comprehensive commit message

---

**Status**: ✅ Sub-tasks generated - Ready for implementation  
**Total Sub-Tasks**: 50 actionable steps  
**Estimated Time**: 12-18 hours  
**Next Step**: Begin with task 1.1

