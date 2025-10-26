# lib/ Files - Usage Analysis

**Created:** October 26, 2025  
**Purpose:** Identify which lib/ files are old/unused

---

## 📁 Current lib/ Structure (44 files)

```
lib/
├── auth/        (7 files)
├── clients/     (4 files)  
├── services/    (4 files)
├── audit/       (3 files)
├── mongodb/     (4 files)
├── organizations/ (1 file)
├── invitations/ (1 file)
├── analytics/   (1 file)
├── emails/      (1 file)
├── sandbox/     (4 files)
└── shared/      (13 files)
```

---

## ❓ AUTH FILES - Which Are Actually Used?

**You have 3 different auth configs:**

### **1. `auth/auth.ts` (185 lines)**
```typescript
// Main NextAuth config with full multi-tenant logic
const authOptions: NextAuthOptions = { ... }
```
**Status:** ❓ Is this the ONE you use?

### **2. `auth/auth-minimal.ts` (267 lines)**
```typescript
// "Working NextAuth configuration with real user login"
const authOptions: NextAuthOptions = { ... }
```
**Status:** ❓ Is this the ONE you use? Or duplicate?

### **3. `auth/custom.ts` (207 lines)**
```typescript
// Custom auth implementation
```
**Status:** ❓ OLD or ACTIVE?

### **Other Auth Files:**
- `auth/api-auth.ts` - API authentication utilities
- `auth/auth-middleware.ts` - Auth middleware
- `auth/helpers.ts` - Auth helper functions
- `auth/provider.tsx` - SessionProvider component

**QUESTION:** Which auth config do you actually use? Can we delete the others?

---

## 🏖️ SANDBOX FILES - Still Using?

```
lib/sandbox/
├── dummy-data-seeder.ts
├── init-collections.ts
├── sandbox-manager.ts
└── schemas.ts

lib/analytics/
└── sandbox-tracker.ts

lib/emails/
└── sandbox-emails.ts
```

**QUESTION:** Are you still using the sandbox system or can we DELETE all 6 files?

---

## 📊 CLIENT FILES - Review

```
lib/clients/
├── adapter.ts       # v1.1 adapter
├── enhancer.ts      # Data enhancement
├── matching.ts      # Client matching
└── secure.ts        # Secure operations (HIPAA)
```

**Status:** ✅ All look production-ready and needed

---

## 🔧 SERVICES FILES - Review

```
lib/services/
├── actions.ts               # Secure actions
├── action-comments.ts       # Action comments
├── messaging.ts             # Secure messaging
└── status-computer.ts       # Smart status computation
```

**Status:** ✅ All look production-ready and needed

---

## 🔒 AUDIT FILES - Review

```
lib/audit/
├── hipaa.ts        # HIPAA compliance logging
├── logger.ts       # Audit logging
└── utils.ts        # Audit utilities
```

**Status:** ✅ All needed for compliance

---

## 🗄️ MONGODB FILES - Review

```
lib/mongodb/
├── client.ts              # MongoDB connection pool ✅
├── init.ts                # Database initialization ✅
├── nextauth-adapter.ts    # Custom NextAuth adapter ✅
└── index.ts               # Exports ✅
```

**Status:** ✅ All needed

---

## 🏢 ORGANIZATIONS & INVITATIONS - Review

```
lib/organizations/
└── utils.ts               # Organization utilities ✅

lib/invitations/
└── utils.ts               # Invitation utilities ✅
```

**Status:** ✅ Both needed for multi-tenant

---

## 🛠️ SHARED UTILITIES - Review

```
lib/shared/
├── brand-colors.ts        ✅ Used in Tailwind config
├── date-utils.ts          ✅ Date helpers
├── email.ts               ✅ Email utilities
├── encryption.ts          ✅ Encryption (HIPAA)
├── formatting.ts          ✅ Data formatting
├── logger.ts              ✅ Logging
├── quota.ts               ❓ "supabase-quota" - DELETE?
├── rate-limit.ts          ✅ Rate limiting
├── scoring.ts             ❓ Review - still used?
├── server-utils.ts        ✅ Server utilities
├── themes.ts              ✅ Theme config
├── utils.ts               ✅ cn() helper
└── validation.ts          ✅ Zod schemas
```

**Questions:**
- `quota.ts` - This was `supabase-quota.ts` - DELETE since no Supabase?
- `scoring.ts` - Is this used or old feature?

---

## 🎯 RECOMMENDED CLEANUP

### **Priority 1: Delete Duplicate Auth Configs**

**You have 3 auth configs. Which ONE do you use?**

1. Keep the one you use
2. Delete the other 2

### **Priority 2: Sandbox System**

**If not using sandbox:**
```bash
rm -rf lib/sandbox/
rm lib/analytics/sandbox-tracker.ts
rm lib/emails/sandbox-emails.ts
```
**Saves: 6 files**

### **Priority 3: Old Utilities**

```bash
rm lib/shared/quota.ts          # Old Supabase quota
rm lib/shared/scoring.ts        # If not used
```

---

## 📋 Quick Questions:

**Answer these and I'll clean up immediately:**

1. **Auth:** Which auth file do you actually use?
   - `auth/auth.ts` (185 lines)
   - `auth/auth-minimal.ts` (267 lines)  
   - `auth/custom.ts` (207 lines)

2. **Sandbox:** Still using sandbox system? (Y/N)
   - If NO → DELETE 6 files

3. **Quota:** Delete `shared/quota.ts` (old Supabase)? (Y/N)

4. **Scoring:** Delete `shared/scoring.ts`? (Y/N)

---

**Just tell me which auth file and Y/N for the others!**

