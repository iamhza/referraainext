# Data Model Migration Plan: Current → v1.1

**Date**: October 2025  
**Goal**: Migrate to clean, HIPAA-compliant, multi-tenant architecture  
**Strategy**: Consolidate where possible, migrate only what's necessary

---

## 🎯 Executive Summary

### ✅ What's Already Good (Keep As-Is)
1. **Service Relationships** - Already aligned with v1.1
2. **HIPAA Infrastructure** - Robust encryption & audit logging exists
3. **Actions Library** - Rich, well-designed (enhance, don't replace)
4. **Multi-tenant Isolation** - Already enforced via `organizationId`

### 🔄 What Needs Changes
1. **User-Organization Model** - Add `org_members` junction table
2. **Client PHI Structure** - Restructure to nested objects
3. **Role System** - Map to new 4-role system
4. **Authorizations** - Add new collection
5. **Provider User Access** - Implement `providerId` linking

### ❌ What to Remove
1. Deprecated client fields (see DATA_MODEL_AUDIT.md)
2. Legacy `connections`, `pending_connections`, `referrals` collections
3. Duplicate organization ID fields (`org_id` vs `organizationId`)

---

## 📊 Side-by-Side Comparison

### 1. Users & Organization Membership

#### **Current Model**
```typescript
// users collection
{
  _id: ObjectId,
  email: string,
  name: string,
  role: 'case_manager' | 'provider' | 'admin',
  organizationId: string,  // Direct reference
  org_id: string,          // Duplicate!
  // ... auth fields
}
```

#### **New Model (v1.1)**
```typescript
// users collection (identity only)
{
  _id: ObjectId,
  email: string,
  name: string,
  passwordHash: string,
  // No organization or role here!
}

// org_members collection (junction table)
{
  _id: ObjectId,
  organizationId: string,
  userId: string,
  role: 'ORG_ADMIN' | 'SUPERVISOR' | 'CASE_MANAGER' | 'PROVIDER_USER',
  providerId?: string,  // For PROVIDER_USER role
  teamId?: string,      // For team-based access
  isActive: boolean,
}
```

#### **✅ Recommendation: ADOPT NEW MODEL**

**Why?**
- **Better Multi-Tenant**: One user can belong to multiple orgs (future-proof)
- **Cleaner Separation**: Identity vs. membership
- **Provider Linking**: Direct `providerId` for provider users
- **Team Support**: Built-in team hierarchy

**Migration Path:**
```javascript
// Create org_members from existing users
users.forEach(user => {
  org_members.insert({
    organizationId: user.organizationId,
    userId: user._id,
    role: mapRole(user.role),  // case_manager → CASE_MANAGER
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });
});

// Clean up users collection
users.updateMany({}, {
  $unset: {
    role: "",
    organizationId: "",
    org_id: "",
  }
});
```

---

### 2. Client Structure

#### **Current Model**
```typescript
{
  _id: ObjectId,
  firstName: string,        // Flat PHI
  lastName: string,         // Flat PHI
  dateOfBirth: string,      // Flat PHI
  email: string,            // Flat PHI
  phone: string,            // Flat PHI
  address: string | object, // Inconsistent!
  city: string,
  state: string,
  zipCode: string,
  primaryDiagnosis: string, // Flat PHI
  // ... 50+ more flat fields
  caseManagerId: string,    // Direct assignment
  organizationId: string,
}
```

#### **New Model (v1.1)**
```typescript
{
  _id: ObjectId,
  organizationId: string,
  status: 'ACTIVE' | 'INACTIVE',
  
  identity: {
    firstName: string,
    lastName: string,
    dob: Date,
    externalId?: string  // PMI
  },
  contact: {
    address: { line1, city, state, zip, county },
    phone?: string,
    email?: string
  },
  bands: {
    language?: string,
    accessibility?: string[]
  },
  clinical: {
    primaryDiagnosis?: string,
    mentalHealthNeeds?: string,
    physicalLimitations?: string
  },
  insurance?: {
    type: 'medicaid' | 'medicare' | 'private' | 'none',
    provider?: string,
    number?: string
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

#### **✅ Recommendation: ADOPT NEW MODEL (Gradual Migration)**

**Why?**
- **Cleaner PHI Boundaries**: Easy to identify what's sensitive
- **Better Encryption**: Can encrypt entire nested objects
- **Standard Structure**: Consistent address format
- **Clinical Context**: Grouped logically

**Migration Path:**
```javascript
// Migrate clients to nested structure
clients.forEach(client => {
  const migrated = {
    _id: client._id,
    organizationId: client.organizationId,
    status: client.status === 'active' ? 'ACTIVE' : 'INACTIVE',
    
    identity: {
      firstName: client.firstName,
      lastName: client.lastName,
      dob: new Date(client.dateOfBirth),
      externalId: client.pmiNumber,
    },
    contact: {
      address: {
        line1: typeof client.address === 'string' ? client.address : client.address.street,
        city: client.city,
        state: client.state,
        zip: client.zipCode,
        county: client.county,
      },
      phone: client.phone,
      email: client.email,
    },
    bands: {
      language: client.primaryLanguage,
      accessibility: client.mobilityStatus ? [client.mobilityStatus] : [],
    },
    clinical: {
      primaryDiagnosis: client.primaryDiagnosis,
      mentalHealthNeeds: null,  // New field
      physicalLimitations: null, // New field
    },
    insurance: client.insurance || {
      type: 'none',
      provider: client.insuranceProvider,
      number: client.insuranceNumber,
    },
    
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
  
  clients_v2.insert(migrated);
});
```

**⚠️ Note: Keep `caseManagerId` for now**
- v1.1 uses `client_assignments` collection
- Current uses `caseManagerId` directly on client
- **Decision**: Keep direct `caseManagerId` (simpler, already works)
- Only add `client_assignments` if we need audit trail of reassignments

---

### 3. Service Relationships

#### **Current Model**
```typescript
{
  _id: ObjectId,
  clientId: string,
  providerId: string,
  providerName: string,
  serviceType: string,
  status: 'REFERRAL_SENT' | 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED',
  startDate?: Date,
  endDate?: Date,
  pausedAt?: Date,
  pauseReason?: string,
  lastActivity?: Date,
  organizationId: string,
  caseManagerId: string,
  createdAt: Date,
  updatedAt: Date,
}
```

#### **New Model (v1.1)**
```typescript
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  providerId: string,
  serviceType: string,
  caseManagerMemberId: string,  // FK to org_members
  
  clientName: string,  // Denormalized
  providerName: string, // Denormalized
  
  status: 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED',
  
  pendingReason?: 'AWAITING_DOCS' | 'AWAITING_CONSENT' | 'AWAITING_STAFFING' | 'SCHEDULING_INTAKE',
  pauseReason?: 'TEMP_HOLD' | 'HOSPITALIZED' | 'CLIENT_UNAVAILABLE' | 'PROVIDER_UNAVAILABLE',
  closeReason?: 'GOALS_MET' | 'FUNDING_ENDED' | 'CLIENT_MOVED' | 'PROVIDER_SWITCH',
  
  flag?: 'NEEDS_ATTENTION' | 'QUALITY_CONCERN' | 'INCIDENT_REVIEW' | 'FUNDING_ISSUE' | 'PROVIDER_UNRESPONSIVE',
  
  phiReleased?: { at: Date, byMemberId: string },
  
  startDate?: Date,
  endDate?: Date,
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

#### **✅ Recommendation: HYBRID APPROACH**

**Keep from Current:**
- ✅ 5-state lifecycle (including `REFERRAL_SENT` - it's useful!)
- ✅ Simple `pauseReason` string (more flexible than enum)
- ✅ Direct `caseManagerId` (no need for `caseManagerMemberId` junction)

**Add from v1.1:**
- ✅ `clientName` denormalized (performance)
- ✅ Enum for `pendingReason`, `closeReason` (data quality)
- ✅ `flag` field (replaces smart status urgency)
- ✅ `phiReleased` tracking (HIPAA compliance)

**Final Structure:**
```typescript
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  providerId: string,
  serviceType: string,
  caseManagerId: string,  // Keep simple, not junction
  
  // Denormalized for performance
  clientName: string,
  providerName: string,
  
  // 5-state lifecycle (keep REFERRAL_SENT!)
  status: 'REFERRAL_SENT' | 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED',
  
  // Structured reasons (new!)
  pendingReason?: 'AWAITING_DOCS' | 'AWAITING_CONSENT' | 'AWAITING_STAFFING' | 'SCHEDULING_INTAKE',
  pauseReason?: string,  // Keep flexible
  closeReason?: 'GOALS_MET' | 'FUNDING_ENDED' | 'CLIENT_MOVED' | 'PROVIDER_SWITCH' | 'OTHER',
  
  // Flag system (new!)
  flag?: 'NEEDS_ATTENTION' | 'QUALITY_CONCERN' | 'INCIDENT_REVIEW' | 'FUNDING_ISSUE' | 'PROVIDER_UNRESPONSIVE',
  flagNote?: string,
  
  // PHI release tracking (new!)
  phiReleased?: {
    at: Date,
    byUserId: string,
    method: 'ROI' | 'CONSENT_FORM' | 'VERBAL'
  },
  
  startDate?: Date,
  endDate?: Date,
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

---

### 4. Actions Library

#### **Current Model**
- 18 action types (Request Intake, Request Update, etc.)
- Rich action library with fields, urgency, roles
- Comments system for threaded conversations
- Dynamic form data
- File attachments

#### **New Model (v1.1)**
```typescript
{
  _id: ObjectId,
  organizationId: string,
  subjectType: 'SERVICE_RELATIONSHIP' | 'REFERRAL',
  subjectId: string,
  type: 'REQUEST_INTAKE' | 'REQUEST_UPDATE' | 'REQUEST_DOCUMENT' | 'GENERAL_MESSAGE',
  status: 'OPEN' | 'COMPLETED' | 'CANCELLED',
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL',
  createdByMemberId: string,
  createdAt: Date,
  dueAt?: Date,
  requestPayload: { notes?: string, docType?: string },
  completedByMemberId?: string,
  completedAt?: Date,
  responsePayload?: { notes?: string, documentId?: string }
}
```

#### **✅ Recommendation: KEEP CURRENT MODEL (It's Better!)**

**Current is Superior Because:**
- ✅ 18 action types vs. 4 (much richer workflow)
- ✅ Dynamic form fields per action type
- ✅ Threaded comments system
- ✅ File attachment support
- ✅ Routing to specific recipients
- ✅ Already HIPAA compliant with encrypted PHI

**Minor Enhancement from v1.1:**
- Add `subjectType` and `subjectId` for clearer linking
- Map `status` to v1.1's `OPEN | COMPLETED | CANCELLED`

**Enhanced Structure:**
```typescript
{
  _id: ObjectId,
  organizationId: string,
  
  // Link to service relationship (enhanced!)
  subjectType: 'SERVICE_RELATIONSHIP' | 'CLIENT' | 'AUTHORIZATION',
  subjectId: string,
  
  // Keep existing rich action system
  type: ActionType,  // 18 types from ACTION_LIBRARY
  title: string,
  description?: string,
  status: 'pending' | 'completed' | 'cancelled',  // Map to OPEN/COMPLETED/CANCELLED
  urgency: 'low' | 'medium' | 'high' | 'critical',
  
  // Keep existing context
  clientId: string,
  providerId?: string,
  serviceType?: string,
  
  // Keep existing data & comments
  data?: object,
  comments?: Comment[],
  
  // Keep existing routing
  createdBy: string,
  routing?: { recipientIds: string[] },
  
  // Dates
  createdAt: Date,
  updatedAt: Date,
  targetDate?: Date,
  completedAt?: Date,
}
```

---

### 5. Authorizations (NEW)

#### **Current Model**
❌ **Does not exist** - authorization data stored in action.data

#### **New Model (v1.1)**
```typescript
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  serviceRelationshipId: string,
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED',
  startDate: Date,
  endDate: Date,
  units: number,
  unitType: 'HOURS_PER_WEEK' | 'HOURS_PER_MONTH' | 'TOTAL_UNITS',
  approvalNumber?: string,
  submittedAt?: Date,
  approvalDate?: Date,
  createdByMemberId: string,
  createdAt: Date,
  updatedAt: Date,
}
```

#### **✅ Recommendation: ADD NEW COLLECTION**

**Why?**
- Authorization lifecycle is complex (draft → submitted → approved → expired)
- Needs dedicated tracking, not buried in actions
- Critical for billing and compliance

**Implementation:**
```typescript
// New collection: authorizations
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  serviceRelationshipId: string,
  
  // Status tracking
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED',
  
  // Authorization details
  startDate: Date,
  endDate: Date,
  units: number,
  unitType: 'HOURS_PER_WEEK' | 'HOURS_PER_MONTH' | 'TOTAL_UNITS',
  approvalNumber?: string,
  
  // Workflow tracking
  submittedAt?: Date,
  submittedBy?: string,
  approvalDate?: Date,
  approvedBy?: string,
  denialReason?: string,
  
  // Files
  submissionDocumentId?: string,  // FK to documents
  approvalDocumentId?: string,    // FK to documents
  
  // Metadata
  createdBy: string,
  createdAt: Date,
  updatedAt: Date,
}
```

---

### 6. HIPAA Infrastructure

#### **Current Implementation**
✅ **Already Robust:**
- `secure_actions` with encrypted PHI fields
- `secure_messages` with encrypted content
- `hipaa_audit_logs` collection
- `audit_logs` collection
- PHI encryption functions (`encryptMessage`, `decryptMessage`)
- `createAuditLog` helper
- 7-year retention tracking

#### **New Model (v1.1)**
```typescript
// audit_log
{
  _id: ObjectId,
  organizationId: string,
  actorMemberId: string,
  eventType: 'LOGIN' | 'CLIENT_VIEW' | 'REFERRAL_SENT' | 'SERVICE_STATUS_CHANGED' | 'DOC_UPLOADED',
  subjectType: 'CLIENT' | 'SERVICE_RELATIONSHIP' | 'DOCUMENT',
  subjectId: string,
  at: Date,
  details?: object
}
```

#### **✅ Recommendation: CONSOLIDATE (Keep Existing, Add Events)**

**Keep:**
- ✅ Existing encryption infrastructure
- ✅ Existing audit log structure
- ✅ Existing `createAuditLog` helper

**Enhance:**
- Add new event types from v1.1 (`SERVICE_STATUS_CHANGED`, etc.)
- Add `subjectType` and `subjectId` to existing audit logs
- Map `actorMemberId` to `userId` (use existing user ID)

**Enhanced Audit Log:**
```typescript
{
  _id: ObjectId,
  organizationId: string,
  
  // Actor (keep simple userId, not memberId)
  userId: string,
  userRole: string,
  
  // Event (enhanced!)
  action: 'LOGIN' | 'CLIENT_VIEW' | 'CLIENT_CREATED' | 'CLIENT_UPDATED' | 
          'SERVICE_STATUS_CHANGED' | 'ACTION_CREATED' | 'DOC_UPLOADED' | 
          'DOC_DOWNLOADED' | 'PHI_ACCESSED' | 'AUTHORIZATION_APPROVED',
  
  // Subject (new!)
  resourceType: 'CLIENT' | 'SERVICE_RELATIONSHIP' | 'DOCUMENT' | 'ACTION' | 'AUTHORIZATION',
  resourceId: string,
  
  // Metadata
  success: boolean,
  details?: object,
  ipAddress?: string,
  userAgent?: string,
  timestamp: Date,
}
```

---

## 🚀 Migration Plan (Phased Approach)

### **Phase 1: Foundation (Week 1)**
✅ **Critical Infrastructure**

1. **Create `org_members` junction table**
   - Migrate existing users → org_members
   - Update API authentication to use org_members
   - Update role checks

2. **Consolidate organization ID**
   - Remove `org_id` field everywhere
   - Use only `organizationId`

3. **Clean up deprecated client fields**
   - Run cleanup script from DATA_MODEL_AUDIT.md
   - Remove unused fields

---

### **Phase 2: Client Restructure (Week 2)**
🔄 **PHI Organization**

1. **Migrate clients to nested structure**
   - identity, contact, bands, clinical
   - Keep backward compatibility for 1 week
   - Update APIs to read/write new structure

2. **Update secure client access functions**
   - Adapt encryption to nested objects
   - Update audit logging

---

### **Phase 3: Service Relationships (Week 3)**
🔄 **Enhanced Workflow**

1. **Add new fields to service_relationships**
   - `clientName`, `providerName` (denormalized)
   - `pendingReason`, `closeReason` enums
   - `flag` field
   - `phiReleased` tracking

2. **Update service relationship APIs**
   - New status change workflows
   - Flag management
   - PHI release tracking

---

### **Phase 4: Authorizations (Week 4)**
➕ **New Feature**

1. **Create `authorizations` collection**
2. **Build authorization workflow UI**
3. **Migrate existing authorization data from actions**
4. **Link to service_relationships**

---

### **Phase 5: Actions Enhancement (Week 5)**
🔄 **Minor Updates**

1. **Add `subjectType` and `subjectId` to actions**
2. **Map status values** (`pending` → `OPEN`, etc.)
3. **Update action creation to link to subjects**

---

### **Phase 6: Audit & Testing (Week 6)**
✅ **Validation**

1. **Enhance audit logging**
   - Add new event types
   - Add `subjectType` and `subjectId`
   - Test all audit trails

2. **Security audit**
   - Verify PHI encryption
   - Verify access controls
   - Verify multi-tenant isolation

3. **Data integrity checks**
   - Validate all migrations
   - Check referential integrity
   - Performance testing

---

## 📋 Migration Scripts (Priority Order)

### 1. Create `org_members` from existing users
```javascript
// scripts/01-create-org-members.js
```

### 2. Consolidate organization ID
```javascript
// scripts/02-consolidate-org-id.js
```

### 3. Clean up deprecated client fields
```javascript
// scripts/03-cleanup-client-fields.js
```

### 4. Migrate clients to nested structure
```javascript
// scripts/04-migrate-client-structure.js
```

### 5. Enhance service relationships
```javascript
// scripts/05-enhance-service-relationships.js
```

### 6. Create authorizations
```javascript
// scripts/06-create-authorizations.js
```

### 7. Enhance actions
```javascript
// scripts/07-enhance-actions.js
```

### 8. Enhance audit logging
```javascript
// scripts/08-enhance-audit-logs.js
```

---

## ✅ What We're KEEPING (Already Good)

1. **Service Relationships Core** - Already solid
2. **Actions Library** - Rich, well-designed (18 action types)
3. **HIPAA Infrastructure** - Encryption + audit logs working
4. **Multi-tenant Isolation** - Already enforced
5. **Smart Status System** - Computed from actions (keep!)
6. **Comments/Threading** - Already implemented
7. **File Upload System** - Secure document handling

---

## ❌ What We're REMOVING

1. **Deprecated Client Fields** (see DATA_MODEL_AUDIT.md):
   - `status`, `currentProvider`, `linkedProviderId`, etc.
   - ~30 fields total

2. **Legacy Collections**:
   - `connections` → Migrate to `service_relationships`
   - `pending_connections` → Delete
   - `referrals` → Migrate to `service_relationships`

3. **Duplicate Fields**:
   - `org_id` → Use only `organizationId`
   - `isActivated` on service_relationships → Use `status`

---

## 🎯 Final Target State

### Core Collections (8 Total)
1. **users** - Identity only
2. **org_members** - User-org-role junction (NEW)
3. **organizations** - Tenant configuration
4. **clients** - Nested PHI structure
5. **providers** - Service provider agencies
6. **service_relationships** - Core workflow (enhanced)
7. **authorizations** - Funding tracking (NEW)
8. **actions** - Rich task system (enhanced)
9. **documents** - Secure file storage
10. **audit_logs** - HIPAA compliance (enhanced)

### Collections to Deprecate
- ❌ `connections` (legacy)
- ❌ `pending_connections` (legacy)
- ❌ `referrals` (migrate to service_relationships)
- ❌ `client_assignments` (not needed - use direct caseManagerId)

---

## 🔐 HIPAA Compliance Status

### ✅ Already Implemented
- PHI encryption (field-level)
- Audit logging (comprehensive)
- Access controls (role-based)
- Secure document storage
- 7-year retention tracking

### 🔄 To Add (from v1.1)
- `phiReleased` tracking on service_relationships
- Enhanced audit event types
- Provider-specific PHI access controls (via `providerId` in org_members)

### ✅ Conclusion: No New HIPAA Infrastructure Needed
Your existing HIPAA setup is solid. We just need to:
1. Add `phiReleased` tracking
2. Enhance audit event types
3. Link provider users to `providerId` for access control

---

## 🚦 Next Steps

**Immediate Actions:**
1. Review this migration plan
2. Approve phased approach
3. I'll create migration scripts for Phase 1

**Your Approval Needed:**
- ✅ Adopt `org_members` junction table?
- ✅ Migrate clients to nested structure?
- ✅ Add `authorizations` collection?
- ✅ Keep existing actions library (with minor enhancements)?
- ✅ 6-week phased migration timeline?

Let me know what you want to adjust, and I'll create the migration scripts! 🚀

