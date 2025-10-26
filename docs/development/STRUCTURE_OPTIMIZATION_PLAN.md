# Production-Grade Structure Optimization Plan

**Created:** October 26, 2025  
**Status:** In Progress  
**Goal:** Transform `next-referra` into a production-grade, domain-driven codebase for continuous building

---

## 📊 Current State Analysis

### Root Directory: ✅ **OPTIMIZED** (28 files)

**Status:** After recent cleanup, root is now clean with documentation in `docs/` and scripts in `scripts/`.

```
/next-referra/
├── src/                    ✅ Application code
├── docs/                   ✅ All documentation (70+ files organized)
├── scripts/                ✅ All scripts (20+ files organized)
├── ai-dev-tasks/          ✅ AI workflow templates
├── tasks/                 ✅ PRDs and task lists
├── tests/                 ✅ E2E tests
├── public/                ✅ Static assets
├── .cursorrules           ✅ Updated with production patterns
└── [config files]         ✅ Minimal, organized
```

---

### `src/app/` Directory: ⚠️ **NEEDS REVIEW**

**Current Structure:**
```
src/app/
├── case-manager/          ✅ CLEAN (3 pages)
│   ├── page.tsx           ✅ Main dashboard
│   ├── settings/          ✅ Settings page
│   └── workspace/         ✅ Issues workspace
│
├── org-admin/             ⚠️ REVIEW NEEDED (8 pages)
│   ├── page.tsx           
│   ├── analytics/         
│   ├── audit/            
│   ├── clients/          
│   ├── invitations/      
│   ├── settings/         
│   ├── teams/            
│   └── users/            
│
├── supervisor/            ⚠️ REVIEW NEEDED (6 pages)
│   ├── page.tsx
│   ├── analytics/
│   ├── assignments/
│   ├── clients/
│   ├── invite/
│   └── team/
│
├── invite/                ✅ CLEAN (onboarding flow)
├── auth/                  ✅ CLEAN (authentication)
└── api/                   ⚠️ NEEDS ORGANIZATION (28 routes)
```

**Analysis:**
- `case-manager/` is production-ready (cleaned in recent refactor)
- `org-admin/` and `supervisor/` need review (may contain old/unused pages)
- `api/` has 28 route folders - could benefit from better organization

---

### `src/components/` Directory: ⚠️ **MODERATE** (19 folders, 114 files)

**Current Structure:**
```
src/components/
├── actions/               ✅ Domain-specific
├── authorizations/        ✅ Domain-specific
├── clients/               ✅ Domain-specific (with drawer/ subfolder)
├── connections/           ✅ Domain-specific
├── dashboard/             ✅ Domain-specific
├── forms/                 ⚠️ Generic? Review needed
├── issues/                ✅ Domain-specific
├── layout/                ✅ Layout components
├── modals/                ⚠️ Generic? Should be domain-specific
├── notifications/         ✅ Domain-specific
├── referrals/             ✅ Domain-specific (with hooks/ subfolder)
├── sandbox/               ✅ Feature-specific
├── services/              ✅ Domain-specific (with drawer/ subfolder)
├── shared/                ✅ Generic/shared
├── skeletons/             ✅ UI primitives
├── tables/                ⚠️ Generic? Review needed
├── templates/             ⚠️ Review needed
├── ui/                    ✅ shadcn components
└── workspace/             ✅ Domain-specific
```

**Recommendations:**
- ✅ `clients/`, `services/`, `referrals/` are excellent examples (with drawer/ and hooks/ subfolders)
- ⚠️ `forms/` - should components be moved to domain folders?
- ⚠️ `modals/` - should be moved to domain folders (e.g., `clients/drawer/`, `services/drawer/`)
- ⚠️ `tables/` - should components be domain-specific? (e.g., `dashboard/ClientTableView.tsx`)

---

### `src/lib/` Directory: ❌ **NEEDS MAJOR REFACTOR** (40+ flat files)

**Current State (FLAT):**
```
src/lib/
├── api-auth.ts
├── audit-logger.ts
├── audit.ts
├── auth-middleware.ts
├── auth-minimal.ts
├── auth.ts
├── auth.tsx
├── brand-colors.ts
├── client-data-enhancer.ts
├── client-matching.ts
├── client-v1.1-adapter.ts
├── custom-auth.ts
├── date-utils.ts
├── email.ts
├── encryption.ts
├── formatting.ts
├── hipaa-audit.ts
├── invitations.ts
├── logger.ts
├── mongodb-nextauth-adapter.ts
├── mongodb.ts
├── nextauth-helpers.ts
├── organization.ts
├── rate-limit.ts
├── scoring.ts
├── secure-action-comments.ts
├── secure-actions.ts
├── secure-client.ts
├── secure-messaging.ts
├── server-utils.ts
├── smart-status-computer.ts
├── supabase-quota.ts
├── supabase.ts
├── themes.ts
├── utils.ts
├── validation.ts
├── analytics/
├── emails/
└── sandbox/
```

**Target Structure (DOMAIN-ORGANIZED):**
```
src/lib/
├── auth/                  # Authentication & authorization
│   ├── client.ts
│   ├── middleware.ts
│   ├── session.ts
│   ├── helpers.ts
│   └── minimal.ts
│
├── clients/               # Client domain logic
│   ├── client.ts         # DB client functions
│   ├── actions.ts        # Server actions
│   ├── validation.ts     # Zod schemas
│   ├── adapter.ts        # v1.1 adapter
│   ├── enhancer.ts       # Data enhancement
│   └── matching.ts       # Client matching logic
│
├── services/              # Service domain logic
│   ├── client.ts
│   ├── actions.ts
│   ├── validation.ts
│   ├── status-computer.ts
│   └── messaging.ts
│
├── referrals/             # Referral domain logic
│   ├── client.ts
│   ├── actions.ts
│   └── validation.ts
│
├── organizations/         # Organization domain logic
│   ├── client.ts
│   ├── actions.ts
│   └── utils.ts
│
├── invitations/           # Invitation domain logic
│   ├── client.ts
│   └── utils.ts
│
├── audit/                 # Audit & compliance
│   ├── logger.ts
│   ├── hipaa.ts
│   └── utils.ts
│
├── supabase/              # Supabase clients
│   ├── client.ts
│   ├── server.ts
│   ├── middleware.ts
│   └── quota.ts
│
├── analytics/             # Analytics (already organized)
│   └── [existing files]
│
├── emails/                # Email system (already organized)
│   └── [existing files]
│
├── sandbox/               # Sandbox system (already organized)
│   └── [existing files]
│
└── shared/                # Shared utilities
    ├── date-utils.ts
    ├── formatting.ts
    ├── encryption.ts
    ├── logger.ts
    ├── rate-limit.ts
    ├── themes.ts
    ├── brand-colors.ts
    └── utils.ts
```

**Migration Checklist:**
- [ ] Create domain folders: `auth/`, `clients/`, `services/`, `referrals/`, `organizations/`, `invitations/`, `audit/`, `shared/`
- [ ] Move auth-related files → `lib/auth/`
- [ ] Move client-related files → `lib/clients/`
- [ ] Move service-related files → `lib/services/`
- [ ] Move audit-related files → `lib/audit/`
- [ ] Move shared utilities → `lib/shared/`
- [ ] Update all imports across the codebase
- [ ] Test thoroughly after migration
- [ ] Update `.cursorrules` examples to reflect new structure

---

### `src/hooks/` Directory: ✅ **CLEAN** (9 files)

**Current State:**
```
src/hooks/
├── use-client-referrals.ts
├── use-client-refresh.ts
├── use-media-query.ts
├── use-online-status.ts
├── use-toast.ts
├── use-workspace-status.ts
├── useMediaQuery.ts
├── useResponsiveKanban.ts
└── useSandbox.ts
```

**Analysis:**
- Global hooks are appropriately placed here
- Domain-specific hooks are correctly in component folders (e.g., `components/clients/drawer/hooks/`)

---

### `src/types/` Directory: ✅ **CLEAN** (9 files)

**Current State:**
```
src/types/
├── actions-v1.1.ts
├── actions.ts
├── index.ts
├── issues.ts
├── missing-deps.d.ts
├── service-messages.ts
├── service-relationships.ts
├── shepherd.d.ts
└── tasks.ts
```

**Analysis:**
- Well-organized by domain
- Could benefit from domain folders if types grow (e.g., `types/clients/`, `types/services/`)

---

## 🎯 Optimization Priorities

### Priority 1: `lib/` Refactor (HIGHEST IMPACT)
**Why:** 40+ flat files make it hard to find logic, understand domains, and scale

**Impact:**
- ✅ Easier to find domain-specific logic
- ✅ Clear separation of concerns
- ✅ Easier onboarding for new developers
- ✅ Better for AI code generation (clear patterns)
- ✅ Scales as new domains are added

**Effort:** Medium (2-3 hours)  
**Risk:** Medium (requires updating many imports)

---

### Priority 2: Review `org-admin/` and `supervisor/` Pages
**Why:** Ensure these pages are active and not old/unused code

**Questions:**
- Are all 8 `org-admin/` pages actively used?
- Are all 6 `supervisor/` pages actively used?
- Can any be deleted or consolidated?

**Effort:** Low (30 minutes)  
**Risk:** Low (just analysis/cleanup)

---

### Priority 3: Review `components/modals/` and `components/forms/`
**Why:** Ensure components are domain-organized, not type-organized

**Questions:**
- Should `modals/` components be moved to domain folders?
- Should `forms/` components be moved to domain folders?
- Are there any unused components?

**Effort:** Low-Medium (1-2 hours)  
**Risk:** Low (move files, update imports)

---

### Priority 4: Optimize `case-manager/` Structure (FUTURE)
**Why:** Ensure it's production-ready for continuous building

**Current Status:** Clean with 3 pages  
**Future Growth:** As features are added, ensure structure remains clean

**Effort:** Ongoing  
**Risk:** None (preventative)

---

## 🚀 Implementation Plan

### Phase 1: Update `.cursorrules` ✅ **COMPLETED**
- [x] Add comprehensive "PRODUCTION-GRADE PROJECT STRUCTURE" section
- [x] Add `[REFERENCE: SRC-ARCHITECTURE]` pattern
- [x] Add `[PATTERN: ROLE-BASED-PAGES]` pattern
- [x] Add `[PATTERN: API-ROUTES]` pattern
- [x] Add `[PATTERN: COMPONENTS]` pattern
- [x] Add `[PATTERN: LIB-ORGANIZATION]` pattern
- [x] Add `[RULE: CONTINUOUS-BUILDING]` pattern
- [x] Add `[ANTI-PATTERN: AVOID-THESE]` examples
- [x] Update quick reference tags

**Result:** Cursor AI now knows how to structure new features automatically! 🎉

---

### Phase 2: `lib/` Refactor 🔄 **NEXT**
1. Create domain folders
2. Move files to appropriate domains
3. Update imports (use Find & Replace)
4. Test thoroughly
5. Commit with clear message

---

### Phase 3: Review Role Pages 📋 **PENDING**
1. Review `org-admin/` pages with user
2. Review `supervisor/` pages with user
3. Delete unused pages
4. Commit cleanup

---

### Phase 4: Component Organization 📋 **PENDING**
1. Review `components/modals/`
2. Review `components/forms/`
3. Review `components/tables/`
4. Move to domain folders if appropriate
5. Commit reorganization

---

## 📚 References

- **Data Model:** `docs/architecture/Referra_Data_Model_v1.1.md`
- **Updated Rules:** `.cursorrules` (lines 53-485)
- **Current Structure:** This document

---

## 🎓 Key Takeaways for Future Building

1. **Domain-Driven Organization:**
   - Organize by **what** (domain), not **how** (technical type)
   - Example: `lib/clients/actions.ts` NOT `lib/actions/client-actions.ts`

2. **Hook-First Pattern:**
   - Extract state management to custom hooks
   - Keep components focused on UI rendering
   - Example: `use-client-drawer.ts` + `ClientDrawer.tsx`

3. **Component Structure:**
   - Domain-specific components in domain folders
   - Complex components get `drawer/` or `modal/` subfolders
   - Component-specific hooks in `hooks/` subfolder
   - Types in `types.ts` file alongside components

4. **Role-Based Pages:**
   - Clear structure: `layout.tsx` + `page.tsx` + feature folders
   - Always include auth + role checks
   - Reference `case-manager/` as the gold standard

5. **Continuous Building:**
   - When adding a new domain, create: `components/[domain]/`, `lib/[domain]/`, `types/[domain].ts`
   - When adding a new role, follow `[PATTERN: ROLE-BASED-PAGES]`
   - When adding a new feature, organize by domain first

---

**Next Steps:** Proceed with Phase 2 (lib/ refactor) upon user approval.

