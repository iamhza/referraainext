# Data Model Audit: Case Manager → Client → Service Relationship

## 🎯 Current Architecture (Service-Centric Model)

```
User (Case Manager) → manages → Clients → have → Service Relationships → with → Providers
```

---

## 📊 Core Collections

### 1. **`users`** (Case Managers, Providers, Admins)

#### ✅ CORE FIELDS (Keep)
```typescript
{
  _id: ObjectId,
  email: string,
  name: string,
  role: 'case_manager' | 'provider' | 'admin',
  organizationId: string,  // Multi-tenant isolation
  org_id: string,          // Legacy alias (consolidate)
  
  // Auth
  password_hash: string,
  is_active: boolean,
  
  // Metadata
  created_at: Date,
  updated_at: Date,
  
  // Optional
  phone?: string,
  avatar_url?: string,
  user_metadata?: object,  // Flexible metadata
}
```

#### ❌ LEGACY/UNUSED (Remove or Consolidate)
- `full_name` → Use `name` only
- `migrated_from_supabase`, `supabase_user_id`, `migration_date` → Remove (migration complete)
- `temp_password`, `tempPassword`, `password` → Keep only `password_hash`
- `team_id` → Not actively used yet (keep for future)
- `permissions` → Not actively used yet (keep for future RBAC)

#### ⚠️ FIX
- **Consolidate**: `org_id` → `organizationId` (use one field)

---

### 2. **`clients`**

#### ✅ CORE FIELDS (Keep)
```typescript
{
  _id: ObjectId,
  
  // Identity (Required)
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  sex?: 'male' | 'female' | 'non-binary' | 'other',
  
  // Contact (Required)
  email?: string,
  phone?: string,
  preferredContactMethod: 'email' | 'phone' | 'both',
  
  // Address
  address: string | object,  // ⚠️ Inconsistent structure
  city: string,
  state: string,
  zipCode: string,
  county?: string,
  
  // Insurance
  insurance?: {
    type: 'medicaid' | 'medicare' | 'private' | 'none',
    provider?: string,
    number?: string,
  },
  pmiNumber?: string,
  waiverType?: string,
  
  // Clinical
  primaryDiagnosis?: string,
  primaryLanguage?: string,
  needsTranslator?: boolean,
  historyOfViolence?: boolean,
  mobilityStatus?: string,
  livingSituation?: string,
  culturalConsiderations?: string,
  additionalNotes?: string,
  
  // Assignment
  caseManagerId: string,  // FK to users
  organizationId: string, // Multi-tenant isolation
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy?: string,  // FK to users
  
  // COMPUTED (populated by API, not stored)
  smartStatus?: object,  // From actions library
  caseManager?: object,  // Joined from users
}
```

#### ❌ LEGACY/UNUSED (Remove)
- `status` → **DEPRECATED** (status now lives on service_relationships)
- `currentProvider` → Use service_relationships instead
- `linkedProviderId` → Use service_relationships instead
- `providerOnboarded` → Not used
- `providerInfo` → Use service_relationships instead
- `profileComplete` → Not used
- `tasks` → Use actions library instead
- `source`, `referralDate` → Not used
- `notes` → Use actions/comments instead
- `hasPendingConnection`, `pendingConnectionId` → Legacy
- `pmi`, `serviceType`, `serviceType1` → Redundant
- `activeReferrals`, `pendingReferrals`, `unreadMessages` → Computed, not stored
- `assignedBy`, `assignedAt` → Not used
- `referralSummary`, `connectionSummary`, `lastActivitySummary` → **COMPUTED ONLY**
- `primaryWaiverType` → Computed from service relationships

#### ⚠️ FIX
- **Insurance**: Consolidate `insurance` object vs top-level `insuranceProvider`, `insuranceNumber`
- **Address**: Standardize to object structure only

---

### 3. **`service_relationships`** (Core of New Model)

#### ✅ CORE FIELDS (Keep)
```typescript
{
  _id: ObjectId,
  
  // Relationship (Required)
  clientId: string,         // FK to clients
  providerId: string,       // FK to providers
  providerName: string,     // Denormalized for performance
  serviceType: string,      // e.g., "ILS", "Night Supervision"
  
  // Status (Required) - 5-State Lifecycle
  status: 'REFERRAL_SENT' | 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED',
  
  // Lifecycle Dates
  startDate?: Date,
  endDate?: Date,
  pausedAt?: Date,
  pauseReason?: string,
  lastActivity?: Date,
  
  // Assignment
  caseManagerId: string,    // FK to users (who manages this relationship)
  organizationId: string,   // Multi-tenant isolation
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
}
```

#### ❌ LEGACY/UNUSED (Remove)
- `isActivated` → **DEPRECATED** (use `status` instead)
- `matchKey` → Not used

---

### 4. **`providers`**

#### ✅ CORE FIELDS (Keep)
```typescript
{
  _id: ObjectId,
  
  // Identity (Required)
  name: string,
  type: 'behavioral_health' | 'residential' | 'employment' | 'community_services' | 'mental_health',
  description?: string,
  
  // Contact
  address?: string,
  phone?: string,
  email?: string,
  website?: string,
  
  // Services
  services: string[],  // Array of service types offered
  
  // Status
  isActive: boolean,
  
  // Organization
  organizationId: string,  // Multi-tenant isolation
  org_id: string,          // Legacy alias (consolidate)
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
}
```

#### ⚠️ FIX
- **Consolidate**: `org_id` → `organizationId` (use one field)

---

### 5. **`actions`** (Task Library for Service Relationships)

#### ✅ CORE FIELDS (Keep)
```typescript
{
  _id: ObjectId,
  
  // Action Definition
  type: string,              // e.g., "request_status_update", "flag_concern"
  title: string,
  description?: string,
  
  // Context
  clientId: string,          // FK to clients
  contextType: 'referral' | 'service' | 'general',
  contextId?: string,        // FK to service_relationship or referral
  providerId?: string,       // FK to providers (if provider-related)
  serviceType?: string,      // Service type this action relates to
  
  // Status
  status: 'pending' | 'completed' | 'cancelled',
  
  // Urgency
  urgency: 'low' | 'medium' | 'high' | 'critical',
  targetDate?: Date,
  scheduledDate?: Date,
  
  // Data
  data?: object,             // Flexible action-specific data
  
  // Assignment & Routing
  createdBy: string,         // FK to users
  createdByName: string,     // Denormalized (leave empty, dynamic lookup)
  routing?: {
    recipientIds: string[],  // FKs to users
  },
  
  // Comments
  comments?: Array<{
    _id: ObjectId,
    content: string,
    createdBy: string,
    createdByName: string,
    createdByRole: string,
    createdAt: Date,
  }>,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  completedAt?: Date,
}
```

#### ❌ LEGACY/UNUSED (Remove)
- `notes` → Migrated to `description` or `comments`

---

## ❌ Collections to DEPRECATE

### 1. `connections` (Legacy)
**Status**: Replaced by `service_relationships`  
**Action**: Keep for backward compatibility, migrate to `service_relationships`

### 2. `pending_connections` (Legacy)
**Status**: Replaced by `service_relationships` with `status: 'REFERRAL_SENT'`  
**Action**: Remove entirely

### 3. `referrals` (Legacy)
**Status**: Replaced by `service_relationships`  
**Action**: Migrate to `service_relationships`, then deprecate

---

## 🛠️ Required Cleanup Actions

### High Priority

1. **✅ DONE**: Clean up all mock data
2. **Consolidate Organization ID**:
   - Users: `org_id` → `organizationId`
   - Providers: `org_id` → `organizationId`
   - Write migration script

3. **Remove Deprecated Client Fields**:
   ```javascript
   db.clients.updateMany({}, {
     $unset: {
       status: "",
       currentProvider: "",
       linkedProviderId: "",
       providerOnboarded: "",
       providerInfo: "",
       profileComplete: "",
       tasks: "",
       notes: "",
       hasPendingConnection: "",
       pendingConnectionId: "",
       activeReferrals: "",
       pendingReferrals: "",
       unreadMessages: "",
     }
   });
   ```

4. **Remove `isActivated` from Service Relationships**:
   ```javascript
   db.service_relationships.updateMany({}, {
     $unset: { isActivated: "", matchKey: "" }
   });
   ```

5. **Consolidate User Auth Fields**:
   ```javascript
   db.users.updateMany({}, {
     $unset: {
       full_name: "",
       migrated_from_supabase: "",
       supabase_user_id: "",
       migration_date: "",
       temp_password: "",
       tempPassword: "",
       password: "",  // Keep only password_hash
     }
   });
   ```

### Medium Priority

6. **Standardize Client Address to Object**:
   - Migrate all string addresses to object format
   - Remove top-level `city`, `state`, `zipCode` fields

7. **Consolidate Client Insurance Fields**:
   - Migrate `insuranceProvider`, `insuranceNumber` into `insurance` object

8. **Migrate `referrals` → `service_relationships`**:
   - Map referral status to service relationship status
   - Preserve referral history
   - Mark old referrals as `CLOSED` or `REFERRAL_SENT`

---

## ✅ Clean Data Model (Target State)

### Core Entities
1. **User** (case_manager, provider, admin)
2. **Client** (managed by case manager)
3. **Service Relationship** (client × provider × service type)
4. **Provider** (offers services)
5. **Action** (tasks/events on service relationships)

### Key Relationships
```
User (case_manager) ──manages──> Client
Client ──has many──> Service Relationships
Service Relationship ──belongs to──> Provider
Service Relationship ──has many──> Actions
```

### Status Flow (Service Relationship Lifecycle)
```
REFERRAL_SENT → PENDING_START → ACTIVE ⟷ PAUSED → CLOSED
```

---

## 📈 Benefits of Clean Model

1. **No Ambiguity**: Status lives on service relationship, not client
2. **Many-to-Many**: Client can have multiple services from multiple providers
3. **Atomic Operations**: Each service relationship is independently managed
4. **Future-Proof**: Supports complex workflows (multiple services, provider changes)
5. **Audit Trail**: Each service relationship has its own lifecycle history
6. **HIPAA Compliant**: Clear data isolation and audit logging

---

## 🚀 Next Steps

1. Run cleanup migrations (remove deprecated fields)
2. Seed fresh data with new model
3. Update TypeScript interfaces to match clean model
4. Remove legacy code paths
5. Update documentation

