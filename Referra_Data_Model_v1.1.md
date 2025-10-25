# **Referra Data Model (v1.1 — Finalized)**  
_Last updated: October 2025_

## **Purpose**  
This document defines the Referra platform’s finalized data architecture for organizations, users, clients, and providers.  
It is designed for **multi-tenant isolation**, **auditable PHI handling**, and **role-based data boundaries** in compliance with HIPAA.

---

## **1. Core Design Principles**

| Principle | Description |
|------------|--------------|
| **Tenant Isolation** | All data is owned by an `organization` and scoped by `organizationId`. |
| **Minimum Necessary Access** | Case managers and providers can view only data tied to their active relationships. |
| **Care-Justified PHI Access** | Providers are granted full PHI for clients they actively serve — as required for service delivery. |
| **Auditability** | Every PHI view, update, or file download is recorded in `audit_log`. |
| **Extensibility** | Each collection is designed to scale across multiple agencies, roles, and integrations. |

---

## **2. Entity Overview**

### **A. organizations**
Represents the case management agency (tenant).

```typescript
{
  _id: ObjectId,
  name: string,
  phiEnabled: boolean,
  baa: {
    signedAt: Date,
    signerUserId: string,
    fileUri: string
  },
  settings: {
    dataRetentionDays: number,
    sso?: object
  },
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}
```

---

### **B. users**
Represents the base identity of an individual (login record only).

```typescript
{
  _id: ObjectId,
  email: string,
  name: string,
  passwordHash: string,
  avatarUrl?: string,
  phone?: string,
  lastLoginAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **C. org_members**
The link between a `user` and an `organization`, defining their role and scope.

```typescript
{
  _id: ObjectId,
  organizationId: string,  // FK → organizations
  userId: string,          // FK → users
  role: 'ORG_ADMIN' | 'SUPERVISOR' | 'CASE_MANAGER' | 'PROVIDER_USER',
  teamId?: string,         // FK → teams
  providerId?: string,     // FK → providers (required if PROVIDER_USER)
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Notes**
- Provider users must have a `providerId` to establish which provider they represent.  
- Role-based access rules are enforced at the API and DB layer.  

---

### **D. clients**
Represents the individual receiving services. This object holds all PHI and care context.

```typescript
{
  _id: ObjectId,
  organizationId: string, // Tenant isolation
  
  status: 'ACTIVE' | 'INACTIVE',
  
  identity: {
    firstName: string,
    lastName: string,
    dob: Date,
    externalId?: string // e.g., PMI number
  },
  contact: {
    address: {
      line1: string,
      city: string,
      state: string,
      zip: string,
      county?: string
    },
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

**Access Rules**
- **Case managers**: full PHI for all assigned clients.  
- **Supervisors**: full PHI for all clients under their team.  
- **Providers**: full PHI for clients tied to their active `service_relationships`.  
- All PHI views logged in `audit_log`.

---

### **E. providers**
Represents a service provider agency or vendor.

```typescript
{
  _id: ObjectId,
  organizationId: string, // The agency that owns this provider relationship
  legalName: string,
  dba?: string,
  serviceTypes: string[], // e.g., ["ILS", "Night Supervision"]
  coverageCounties: string[],
  contacts: {
    email?: string,
    phone?: string,
    website?: string
  },
  licenses: [{
    type: string,
    number: string,
    expiresAt: Date
  }],
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **F. referrals**
Temporary container for provider matching (“Tinder-style” workflow).

```typescript
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  serviceTypes: string[],
  criteria: {
    county?: string,
    urgency?: 'low' | 'medium' | 'high',
    accessibility?: string[]
  },
  selectionQueue: [{
    providerId: string,
    matchedServices: string[],
    decision: 'PENDING_REVIEW' | 'SELECTED' | 'SKIPPED'
  }],
  state: 'DRAFT' | 'PENDING_SELECTION' | 'SELECTION_MADE' | 'CLOSED',
  createdByMemberId: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **G. service_relationships**
Permanent "service card" connecting a client, case manager, and provider.

```typescript
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  providerId: string,
  serviceType: string,
  caseManagerMemberId: string,

  clientName: string,
  providerName: string,

  status: 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED',

  pendingReason?: 'AWAITING_DOCS' | 'AWAITING_CONSENT' | 'AWAITING_STAFFING' | 'SCHEDULING_INTAKE',
  pauseReason?: 'TEMP_HOLD' | 'HOSPITALIZED' | 'CLIENT_UNAVAILABLE' | 'PROVIDER_UNAVAILABLE',
  closeReason?: 'GOALS_MET' | 'FUNDING_ENDED' | 'CLIENT_MOVED' | 'PROVIDER_SWITCH',

  phiReleased?: {
    at: Date,
    byMemberId: string
  },

  startDate?: Date,
  endDate?: Date,
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Note:** The legacy `flag` field has been replaced by the `issues` collection (see below).

**Access Logic**
- Drives the "My Caseload" and "Provider Dashboard" views.  
- Provider users only see service_relationships with their own `providerId`.  
- When linked, they gain access to the full `client` object for that record (via secure join).

---

### **H. issues**
Collaborative workspace for resolving service-related problems (replaces legacy `flag` system).

```typescript
{
  _id: ObjectId,
  organizationId: string,
  serviceRelationshipId: string, // FK → service_relationships
  clientId: string,               // FK → clients (for quick queries)
  
  type: 'QUALITY_CONCERN' | 'INCIDENT_REVIEW' | 'FUNDING_ISSUE' | 'OTHER',
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED',
  
  comments: [{
    _id: ObjectId,               // Unique comment ID
    content: string,
    createdByMemberId: string,
    createdAt: Date
  }],
  
  relatedTaskIds: string[],      // FK → tasks (to-dos created to resolve this issue)
  
  // Message escalation (bidirectional linking)
  sourceMessageId?: string,      // The message that triggered this issue
  relatedMessageIds?: string[],  // Other relevant messages from thread
  
  createdByMemberId: string,
  createdAt: Date,
  resolvedByMemberId?: string,
  resolvedAt?: Date
}
```

**UI Display**
- **Caseload Table:** "Items (x)" where x = count of `OPEN` or `IN_PROGRESS` issues
- **Workspace Sidebar:** Grouped by client → Active/Archived folders
- **Workspace Format:** `[Provider Name] - [Service Type]: [Issue Type]`

**Workflow**
1. User clicks "Raise Issue" → creates new issue document
2. Collaborators discuss via `comments` array (threaded chat)
3. Case manager creates tasks and links via `relatedTaskIds`
4. When resolved → status changes to `RESOLVED` → moves to Archived folder
5. UI automatically updates active issue count

---

### **I. authorizations**
Tracks service funding approvals and renewals.

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
  updatedAt: Date
}
```

---

### **J. service_messages**
Secure communication thread between case managers and providers for a specific service relationship.

```typescript
{
  _id: ObjectId,
  organizationId: string,        // Tenant isolation
  serviceRelationshipId: string, // FK → service_relationships
  clientId: string,              // FK → clients (for quick queries)
  
  content: string,               // Message text (PHI protected)
  
  // Sender identity
  senderMemberId: string,        // FK → org_members
  senderType: 'CASE_MANAGER' | 'PROVIDER_USER',
  
  // Issue escalation
  linkedIssueId?: string,        // If this message led to an issue
  isIssueTrigger?: boolean,      // True if this message created the issue
  
  // Read tracking
  readAt?: Date,
  readByMemberId?: string,
  
  // Attachments (future)
  attachmentUris?: string[],
  
  createdAt: Date
}
```

**Access Rules:**
- Case managers can view messages for their assigned service relationships
- Provider users can view messages for service relationships tied to their providerId
- All message views logged in `audit_log`
- Messages are PHI and encrypted at rest

**Indexes:**
- `organizationId + serviceRelationshipId + createdAt` (primary query)
- `clientId` (for client-level queries)
- `linkedIssueId` (for issue cross-reference)

---

### **K. tasks**
Flexible task management system for personal and shared to-dos.

```typescript
{
  _id: ObjectId,
  organizationId: string,
  
  ownerMemberId: string,         // User who created the task
  assigneeMemberId: string,      // User responsible for completing it
  
  title: string,
  description?: string,
  
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED',
  dueDate?: Date,
  
  // Context Links (optional - for client/service-related tasks)
  clientId?: string,
  serviceRelationshipId?: string,
  issueId?: string,              // If task is linked to an issue
  
  createdAt: Date,
  completedAt?: Date,
  completedByMemberId?: string
}
```

**Use Cases**
- **Personal Tasks:** Case manager's private to-do list (owner = assignee)
- **Assigned Tasks:** Supervisor assigns task to case manager (owner ≠ assignee)
- **Issue-Linked Tasks:** Tasks created to resolve a specific issue (has `issueId`)
- **Client Tasks:** General tasks related to a client (has `clientId`)

**Access Rules**
- Users see tasks where they are owner OR assignee
- Tasks linked to issues inherit issue's visibility rules

---

### **L. client_assignments**
Audit trail of client ownership (supervisor & case manager).

```typescript
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  caseManagerMemberId: string,
  supervisorMemberId: string,
  assignedAt: Date,
  endedAt?: Date
}
```

---

### **M. documents**
Secure PHI file storage (encrypted in S3 or GCS).

```typescript
{
  _id: ObjectId,
  organizationId: string,
  clientId: string,
  serviceRelationshipId?: string,
  uploadedByMemberId: string,
  docType: 'ISP' | 'IAPP' | 'PROGRESS_NOTE' | 'AUTH' | 'ROI' | 'OTHER',
  storageUri: string,
  fileName: string,
  fileSize: number,
  createdAt: Date
}
```

---

### **N. audit_log**
Immutable security camera for PHI events.

```typescript
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

---

## **3. PHI Access Policy Summary**

| Role | PHI Access Scope | Example |
|------|------------------|----------|
| **ORG_ADMIN** | All data in organization | Full admin panel |
| **SUPERVISOR** | All clients under team | Team dashboard |
| **CASE_MANAGER** | Full PHI for assigned clients | Caseload view |
| **PROVIDER_USER** | Full PHI for clients under active service_relationship | Provider dashboard |
| **External (No Auth)** | None | Public endpoints (e.g., landing page) |

**Note:**  
Providers receive full client details (including CSSP, IAPP, and contact info) *only* for clients with an active `service_relationship`.  
Access is automatically revoked when that relationship is closed.

---

## **4. Audit & Retention**

- All PHI access events → `audit_log`  
- Retention period → `organizations.settings.dataRetentionDays`  
- Soft deletes (`deletedAt`) trigger quarantine before purge  
- All exports require admin approval and are logged

---

## **5. Benefits of This Model**

✅ True many-to-many structure (client ↔ service ↔ provider)  
✅ Full traceability and audit compliance  
✅ Simple, intuitive onboarding for org admins  
✅ Controlled PHI access for providers, aligned with care workflow  
✅ Scalable for future payer and EHR integrations
