# `/lib` - Business Logic & Utilities

**Organized by domain for production-grade scalability and maintainability.**

---

## 📁 Structure

```
src/lib/
├── auth/                  # Authentication & Authorization
│   ├── api-auth.ts        # API authentication utilities
│   ├── auth-minimal.ts    # NextAuth configuration (ACTIVE)
│   ├── helpers.ts         # Auth helper functions
│   └── provider.tsx       # SessionProvider component
│
├── clients/               # Client Domain Logic
│   ├── adapter.ts         # Client v1.1 adapter
│   ├── enhancer.ts        # Client data enhancement
│   ├── matching.ts        # Client matching algorithms
│   └── secure.ts          # Secure client operations
│
├── services/              # Service Domain Logic
│   ├── actions.ts         # Service actions
│   ├── action-comments.ts # Action comment handling
│   ├── messaging.ts       # Service messaging
│   └── status-computer.ts # Smart status computation
│
├── referrals/             # Referral Domain Logic
│   └── [future referral logic]
│
├── organizations/         # Organization Domain Logic
│   └── utils.ts           # Organization utilities
│
├── invitations/           # Invitation Domain Logic
│   └── utils.ts           # Invitation utilities
│
├── audit/                 # Audit & Compliance
│   ├── logger.ts          # Audit logging
│   ├── hipaa.ts           # HIPAA compliance utilities
│   └── utils.ts           # Audit utilities
│
├── mongodb/               # MongoDB Client & Setup
│   ├── client.ts          # MongoDB connection pool
│   ├── init.ts            # Database initialization
│   ├── nextauth-adapter.ts # Custom NextAuth adapter
│   └── index.ts           # Exports
│
├── analytics/             # Analytics Domain
│   └── sandbox-tracker.ts
│
├── emails/                # Email System
│   └── sandbox-emails.ts
│
├── sandbox/               # Sandbox System
│   ├── dummy-data-seeder.ts
│   ├── init-collections.ts
│   ├── sandbox-manager.ts
│   └── schemas.ts
│
└── shared/                # Shared Utilities
    ├── brand-colors.ts    # Brand color system
    ├── date-utils.ts      # Date manipulation
    ├── email.ts           # Email utilities
    ├── encryption.ts      # Encryption helpers
    ├── formatting.ts      # Data formatting
    ├── logger.ts          # Logging utilities
    ├── rate-limit.ts      # Rate limiting
    ├── scoring.ts         # Scoring algorithms
    ├── server-utils.ts    # Server-side utilities
    ├── themes.ts          # Theme configuration
    ├── utils.ts           # General utilities
    └── validation.ts      # Zod validation schemas
```

---

## 🎯 Organization Principles

### 1. **Domain-Driven Organization**
Files are organized by **business domain** (clients, services, auth), not by technical type (actions, utils, validators).

✅ **Good:**
```typescript
import { enhanceClientData } from '@/lib/clients/enhancer';
import { computeStatus } from '@/lib/services/status-computer';
```

❌ **Bad (old flat structure):**
```typescript
import { enhanceClientData } from '@/lib/client-data-enhancer';
import { computeStatus } from '@/lib/smart-status-computer';
```

### 2. **Scalability**
When adding new domains, create a new folder:
```bash
# Adding appointments domain
mkdir src/lib/appointments
touch src/lib/appointments/client.ts
touch src/lib/appointments/utils.ts
touch src/lib/appointments/validation.ts
```

### 3. **Clear Naming**
- Within domain folders, use simple names: `utils.ts`, `client.ts`, `actions.ts`
- The folder name provides context: `lib/clients/utils.ts` is clearly client utilities

---

## 📚 Usage Examples

### Importing from Domain Folders

```typescript
// Auth
import { authOptions } from '@/lib/auth/auth';
import { getApiSession } from '@/lib/auth/api-auth';

// Clients
import { enhanceClientData } from '@/lib/clients/enhancer';
import { matchClients } from '@/lib/clients/matching';

// Services
import { computeSmartStatus } from '@/lib/services/status-computer';
import { secureMessage } from '@/lib/services/messaging';

// MongoDB
import clientPromise from '@/lib/mongodb/client';

// Shared Utilities
import { formatDate } from '@/lib/shared/date-utils';
import { encrypt } from '@/lib/shared/encryption';
```

---

## 🚀 Adding New Domain Logic

**Example: Adding "Appointments" Domain**

1. **Create domain folder:**
   ```bash
   mkdir src/lib/appointments
   ```

2. **Create domain files:**
   ```bash
   # Database client functions
   touch src/lib/appointments/client.ts

   # Server actions
   touch src/lib/appointments/actions.ts

   # Validation schemas
   touch src/lib/appointments/validation.ts

   # Domain utilities
   touch src/lib/appointments/utils.ts
   ```

3. **Implement domain logic:**
   ```typescript
   // src/lib/appointments/client.ts
   import clientPromise from '@/lib/mongodb/client';

   export async function getAppointments(userId: string) {
     const client = await clientPromise;
     const db = client.db('referradb');
     return db.collection('appointments')
       .find({ userId })
       .toArray();
   }
   ```

4. **Use in your app:**
   ```typescript
   import { getAppointments } from '@/lib/appointments/client';
   ```

---

## 🔗 Related Documentation

- **Structure Patterns:** See `.cursorrules` → `[PATTERN: LIB-ORGANIZATION]`
- **Data Model:** `docs/architecture/Referra_Data_Model_v1.1.md`
- **Optimization Plan:** `docs/development/STRUCTURE_OPTIMIZATION_PLAN.md`

---

**Last Updated:** October 26, 2025  
**Refactored From:** Flat 40+ file structure → Domain-organized structure

