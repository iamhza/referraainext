# Cleanup Audit - Unused Code Analysis

**Created:** October 26, 2025  
**Purpose:** Identify old, unused code for deletion

---

## 🎯 What You're Actually Using

Based on our conversation and `.cursorrules`:

### **Active User Roles:**
1. ✅ **case_manager** - Primary user (dashboard, clients, workspace)
2. ✅ **org_admin** - Organization administrators
3. ✅ **supervisor** - Team supervisors
4. ❓ **provider** - You said "deleted, starting fresh"

### **Active Pages (case-manager):**
- ✅ `/case-manager` - Main dashboard with ClientTableView
- ✅ `/case-manager/workspace` - Issues workspace (1,210 lines)
- ✅ `/case-manager/settings` - Settings page

### **Active Components:**
- ✅ `ClientTableView.tsx` - Main dashboard table
- ✅ `ClientDrawer` - New production-grade drawer
- ✅ `ServiceDrawer` - Refactored drawer
- ✅ `ReferralForm` - Refactored with hooks

---

## ⚠️ POTENTIAL CLEANUP CANDIDATES

### **1. Old/Unused Pages**

#### **Test Pages (DELETE?):**
```
src/app/test/
├── connection-test/page.tsx
└── toast/page.tsx

src/app/test-enhanced-cards/page.tsx
```
**Question:** Are these still needed or can we delete?

#### **Referrals Pages (REVIEW):**
```
src/app/referrals/page.tsx
```
**Question:** You have `/case-manager/new-referral` - is `/referrals` old?

---

### **2. Org-Admin Pages (REVIEW)**

**Current Structure:**
```
src/app/org-admin/
├── analytics/      ✅ Keep
├── audit/          ✅ Keep
├── clients/        ❓ Review
├── invitations/    ✅ Keep
├── settings/       ✅ Keep
├── teams/          ✅ Keep
└── users/          ✅ Keep
```

**Questions:**
- Is `org-admin/clients/` used or is it old iteration?

---

### **3. Supervisor Pages (REVIEW)**

**Current Structure:**
```
src/app/supervisor/
├── analytics/      ✅ Keep?
├── assignments/    ✅ Keep?
├── clients/        ❓ Review
├── invite/         ✅ Keep?
└── team/           ✅ Keep?
```

**Questions:**
- Are ALL supervisor pages actively used?
- Any old iterations in here?

---

### **4. API Routes to Review**

#### **Admin Routes (Some May Be Old):**
```
src/app/api/admin/
├── cleanup-broken-clients/    ❓ One-time script?
├── cleanup-client/            ❓ One-time script?
├── dashboard-metrics/         ✅ Keep
├── fix-orphaned-clients/      ❓ One-time script?
├── migrate-clients/           ❓ One-time migration?
├── migrate-referrals/         ❓ One-time migration?
├── standardize-status/        ❓ One-time script?
└── standardize-urgency/       ❓ One-time script?
```

**Question:** Can we move one-time scripts to `scripts/migrations/`?

#### **Provider Routes (YOU SAID DELETE PROVIDER):**
```
src/app/api/provider/
└── quota-status/
```
**Action:** DELETE (you're starting provider fresh)

---

### **5. Old Components (POTENTIAL CLEANUP)**

#### **Sandbox Components:**
```
src/components/sandbox/
└── ConversionModal.tsx (already deleted)
```

#### **Old Tables:**
```
src/components/tables/
├── ClientsTable.tsx        ❌ DELETED (confirmed)
├── ReferralsTable.tsx      ❓ Review - still used?
```

#### **Old Forms:**
```
src/components/forms/
└── ClientForm.tsx          ❓ Review - or use ReferralForm?
```

#### **Old Referral Components:**
```
src/components/referrals/
├── ReferralDetailsPanel.tsx    ❓ OLD or ACTIVE?
├── ReferralFormPanel.tsx       ❓ OLD or ACTIVE?
├── ReferralsList.tsx           ❌ DELETED (you said delete)
├── SubmissionsModal.tsx        ✅ Keep?
```

---

### **6. Provider Components (DELETE ALL)**

**You said:** "delete anything related to provider side"

```
src/components/providers/
└── ProviderDirectoryIntegration.tsx  ❌ DELETED

Any other provider components?
```

---

### **7. Context Providers (REVIEW)**

```
src/contexts/
└── TourContext.tsx    ❓ Still using tour system?
```

---

### **8. Old Scripts (CHECK)**

**Already cleaned up:** Moved to `scripts/` folder ✅

**But check for one-time migrations:**
```
scripts/
├── migrate-*.js              ❓ Keep or delete after run?
├── seed-*.js                 ❓ Keep for development
├── fix-*.js                  ❓ One-time fixes?
```

---

## 🚀 Recommended Cleanup Process

### **Phase 1: Easy Wins** (Delete confirmed old code)
1. Delete `src/app/test/` and `src/app/test-enhanced-cards/`
2. Delete `src/app/api/provider/`
3. Delete one-time migration API routes (move to scripts)
4. Delete old ESLint-error files if not used

### **Phase 2: Review with You** (Need your confirmation)
1. Review `org-admin/clients/` - old or active?
2. Review `supervisor/` pages - all active?
3. Review `ReferralDetailsPanel` and `ReferralFormPanel` - old or active?
4. Review `ClientForm.tsx` - old or active?

### **Phase 3: Refactor Large Files** (After cleanup)
1. `src/app/case-manager/workspace/page.tsx` (1,210 lines)
2. `ClientTableView.tsx` (if needed)

---

## 📋 Questions for You

**Answer these to guide cleanup:**

1. **Test pages:** Delete `test/` and `test-enhanced-cards/`? (Y/N)
2. **Provider:** Confirm delete ALL provider-related code? (Y/N)
3. **Org-admin clients:** Is this page used or old iteration?
4. **Supervisor pages:** Are all 5 pages actively used?
5. **Referral components:** Which are old: ReferralDetailsPanel? ReferralFormPanel?
6. **Tour system:** Still using TourContext or can we delete?
7. **Admin API cleanup routes:** One-time scripts? Move to scripts/?

---

**Let me know what you want to focus on first!**

