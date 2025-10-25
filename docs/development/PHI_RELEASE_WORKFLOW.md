# PHI Release Workflow - Referra Platform

## 🔒 Overview

**PHI (Protected Health Information)** release is a critical HIPAA-compliant feature that controls when and how sensitive client data is shared between case managers and service providers.

### Key Concept

PHI Release is a **formal authorization checkpoint** that ensures:
- Client consent is obtained before sharing sensitive information
- Providers only access PHI when legally authorized
- All data sharing is documented and auditable
- HIPAA compliance is maintained throughout the referral process

---

## 📊 Data Model

### Location: `service_relationships` Collection

```typescript
{
  _id: ObjectId,
  clientId: string,
  providerId: string,
  caseManagerId: string,
  organizationId: string,
  status: 'REFERRAL_SENT' | 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED',
  
  // PHI Release Field
  phiReleased?: {
    at: Date,          // When PHI was released
    byMemberId: string // Who released it (org_member ID)
  },
  
  // ... other fields
}
```

---

## 🔄 Complete Workflow

### Step 1: Referral Created (Status: `REFERRAL_SENT`)

**Case Manager Actions:**
- Creates referral for client to specific provider
- Selects service type needed
- Adds basic referral notes

**System State:**
```json
{
  "status": "REFERRAL_SENT",
  "phiReleased": null  // PHI NOT yet released
}
```

**Provider Can See:**
- Client name (last initial only: "Emily J.")
- Age range (e.g., "30-35")
- Service type requested
- Urgency level
- Basic needs description

**Provider CANNOT See:**
- Full name
- Exact date of birth
- Diagnosis/clinical information
- Medical/treatment history
- Medications
- Contact information
- Previous service history

---

### Step 2: Provider Reviews & Accepts

**Provider Actions:**
- Reviews referral with limited information
- Accepts if they have capacity and appropriate services
- Rejects if unable to serve

**System State:**
```json
{
  "status": "PENDING_START",
  "phiReleased": null  // Still not released
}
```

---

### Step 3: Case Manager Obtains Consent

**Case Manager Actions:**
1. ✅ Obtain signed ROI (Release of Information) form from client
2. ✅ Upload consent document to system
3. ✅ Verify all required information is accurate
4. ✅ Click "Release PHI to Provider" button

**Required Documents:**
- Signed consent/ROI form
- Current authorization (if applicable)
- Any court orders or legal documentation (if applicable)

---

### Step 4: PHI Released

**Case Manager Action:**
- Clicks "Release PHI to Provider" in service menu

**System State:**
```json
{
  "status": "PENDING_START",
  "phiReleased": {
    "at": "2025-01-15T14:30:00Z",
    "byMemberId": "507f1f77bcf86cd799439011"
  }
}
```

**Provider Can NOW See:**
- ✅ Full client name
- ✅ Complete date of birth
- ✅ Full diagnosis/clinical information
- ✅ Medical/treatment history
- ✅ Current medications
- ✅ Contact information
- ✅ Previous service providers
- ✅ Treatment notes and goals
- ✅ All uploaded documents

---

### Step 5: Service Delivery (Status: `ACTIVE`)

**Provider Actions:**
- Schedules intake appointment
- Accesses full client profile
- Documents service delivery
- Coordinates care with case manager

**System State:**
```json
{
  "status": "ACTIVE",
  "phiReleased": {
    "at": "2025-01-15T14:30:00Z",
    "byMemberId": "507f1f77bcf86cd799439011"
  },
  "startDate": "2025-01-20T00:00:00Z"
}
```

---

## 🎨 UI/UX Implementation

### 1. Table View (✅ Already Implemented)

**Display PHI Status:**
```tsx
{svc.phiReleased && (
  <Tooltip>
    <Shield className="w-3.5 h-3.5 text-green-600" />
    <TooltipContent>
      PHI Released: {format(new Date(svc.phiReleased.at), 'MMM d, yyyy')}
    </TooltipContent>
  </Tooltip>
)}
```

**Visual Indicator:**
- 🛡️ Green shield icon = PHI released
- No icon = PHI not yet released

---

### 2. Service Menu (⋮) - To Be Implemented

**When PHI NOT Released:**
```tsx
<DropdownMenuItem
  onClick={handleReleasePhi}
  className="font-medium text-blue-700"
  disabled={!hasRequiredConsent}
>
  <Shield className="w-4 h-4 mr-2" />
  Release PHI to Provider
</DropdownMenuItem>
```

**When PHI Released:**
```tsx
<DropdownMenuItem disabled>
  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
  PHI Released ({format(phiReleased.at, 'MMM d, yyyy')})
</DropdownMenuItem>

<DropdownMenuItem
  onClick={handleViewConsent}
  className="font-medium"
>
  <FileText className="w-4 h-4 mr-2" />
  View Consent Form
</DropdownMenuItem>

<DropdownMenuItem
  onClick={handleRevokePhi}
  className="font-medium text-red-700"
>
  <XCircle className="w-4 h-4 mr-2" />
  Revoke PHI Access
</DropdownMenuItem>
```

---

### 3. Service Detail Drawer - To Be Implemented

**PHI Status Section:**

**NOT Released:**
```tsx
<div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
  <div className="flex items-center gap-3">
    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
    <div className="flex-1">
      <p className="font-semibold text-amber-900">PHI Not Yet Released</p>
      <p className="text-sm text-amber-700 mt-1">
        Provider cannot access full client details until PHI is released.
      </p>
    </div>
  </div>
  
  <div className="mt-4 space-y-2">
    <p className="text-sm font-medium text-amber-900">Required Before Release:</p>
    <div className="space-y-1.5 text-sm text-amber-800">
      {hasConsent ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Signed consent form uploaded</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span>Signed consent form required</span>
        </div>
      )}
    </div>
  </div>
  
  <Button
    onClick={handleReleasePhi}
    disabled={!hasConsent}
    className="mt-4 w-full"
  >
    <Shield className="w-4 h-4 mr-2" />
    Release PHI to Provider
  </Button>
</div>
```

**Released:**
```tsx
<div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
  <div className="flex items-center gap-3">
    <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
    <div className="flex-1">
      <p className="font-semibold text-green-900">PHI Released to Provider</p>
      <p className="text-sm text-green-700 mt-1">
        Released on {format(new Date(phiReleased.at), 'MMMM d, yyyy')} by {releasedByName}
      </p>
    </div>
  </div>
  
  <div className="mt-4 flex gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={handleViewConsent}
    >
      <FileText className="w-4 h-4 mr-2" />
      View Consent
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={handleRevokePhi}
      className="text-red-700 hover:text-red-800 hover:bg-red-50"
    >
      <XCircle className="w-4 h-4 mr-2" />
      Revoke Access
    </Button>
  </div>
</div>
```

---

### 4. Provider View - To Be Implemented

**When PHI NOT Released:**
```tsx
<div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-lg border-2 border-slate-200">
  <Lock className="w-16 h-16 text-slate-400 mb-4" />
  <h3 className="text-lg font-semibold text-slate-900 mb-2">
    Awaiting PHI Release
  </h3>
  <p className="text-sm text-slate-600 text-center max-w-md">
    The case manager must release protected health information before you can view full client details. 
    You will be notified when access is granted.
  </p>
  
  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-sm text-blue-900 font-medium mb-2">What you can see:</p>
    <ul className="text-sm text-blue-800 space-y-1">
      <li>• Client name (first name, last initial)</li>
      <li>• Age range</li>
      <li>• Service type requested</li>
      <li>• Referral urgency</li>
    </ul>
  </div>
</div>
```

**When PHI Released:**
```tsx
<div className="space-y-6">
  {/* PHI Status Banner */}
  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
    <div className="flex items-center gap-2 text-green-800">
      <Shield className="w-4 h-4" />
      <span className="text-sm font-medium">
        PHI access granted on {format(phiReleased.at, 'MMM d, yyyy')}
      </span>
    </div>
  </div>
  
  {/* Full Client Profile */}
  <ClientFullProfile client={client} />
</div>
```

---

## 🔐 Security & Compliance

### HIPAA Compliance Features

✅ **Authorization Documentation**
- Tracks who released PHI and when
- Links to uploaded consent forms
- Maintains audit trail

✅ **Minimum Necessary Rule**
- Providers only see limited info before authorization
- Full PHI only after explicit release
- Access can be revoked if needed

✅ **Audit Trail**
```json
{
  "event": "PHI_RELEASED",
  "serviceRelationshipId": "...",
  "clientId": "...",
  "providerId": "...",
  "releasedBy": "...",
  "releasedAt": "2025-01-15T14:30:00Z",
  "consentFormId": "...",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

✅ **Revocation Capability**
- Case manager can revoke PHI access
- Provider loses access to sensitive data
- Maintains compliance with client rights

---

## 📋 Required Documents

### 1. ROI (Release of Information) Form

**Must Include:**
- Client name and signature
- Case manager name
- Provider name/organization
- Specific information to be shared
- Purpose of disclosure
- Expiration date (typically 12 months)
- Client rights statement

### 2. Consent for Services

**If client is minor or has guardian:**
- Guardian consent required
- Legal documentation of guardianship

### 3. Authorization for Payment

**If applicable:**
- Insurance authorization
- Medicaid/Medicare consent

---

## 🚨 Error States & Validations

### Validations Before PHI Release:

```typescript
async function validatePhiRelease(serviceRelationshipId: string) {
  const errors = [];
  
  // 1. Check consent form exists
  const consentForm = await getConsentForm(serviceRelationshipId);
  if (!consentForm) {
    errors.push("Signed consent form required");
  }
  
  // 2. Check consent is not expired
  if (consentForm && new Date(consentForm.expiresAt) < new Date()) {
    errors.push("Consent form has expired");
  }
  
  // 3. Check service status
  const service = await getServiceRelationship(serviceRelationshipId);
  if (service.status === 'CLOSED') {
    errors.push("Cannot release PHI for closed service");
  }
  
  // 4. Check client consent is active
  const client = await getClient(service.clientId);
  if (!client.consentActive) {
    errors.push("Client consent is revoked or inactive");
  }
  
  return errors;
}
```

### Error Messages:

**Missing Consent:**
```
❌ Cannot Release PHI
Signed consent form is required before releasing protected health information.
[Upload Consent Form]
```

**Expired Consent:**
```
❌ Consent Expired
The consent form has expired. Please obtain a new signed consent before releasing PHI.
[Upload New Consent]
```

**Already Released:**
```
ℹ️ PHI Already Released
Protected health information was released on [date] by [name].
[View Details]
```

---

## 🛠️ Implementation Checklist

### Backend API

- [ ] `POST /api/service-relationships/[id]/release-phi`
  - Validate consent exists
  - Set `phiReleased.at` and `phiReleased.byMemberId`
  - Create audit log entry
  - Notify provider

- [ ] `POST /api/service-relationships/[id]/revoke-phi`
  - Remove `phiReleased` field
  - Create audit log entry
  - Notify provider

- [ ] `GET /api/service-relationships/[id]/phi-status`
  - Return PHI status
  - Return who released and when
  - Return consent form details

### Frontend Components

- [ ] PHI status indicator in table (✅ Already done!)
- [ ] "Release PHI" button in service menu
- [ ] PHI status section in Service Detail Drawer
- [ ] Consent form upload modal
- [ ] PHI revocation confirmation dialog
- [ ] Provider view with restricted access

### Database

- [ ] Ensure `phiReleased` field exists in `service_relationships`
- [ ] Add indexes for PHI queries
- [ ] Create `phi_audit_log` collection (optional)

### Notifications

- [ ] Email to provider when PHI released
- [ ] Email to case manager confirming release
- [ ] In-app notification to provider

---

## 📊 Analytics & Reporting

### Metrics to Track:

1. **Time to PHI Release**
   - Average time between referral acceptance and PHI release
   - Identifies bottlenecks in consent process

2. **PHI Release Rate**
   - % of accepted referrals with PHI released
   - Tracks compliance

3. **Revocation Rate**
   - How often PHI access is revoked
   - May indicate service issues

4. **Expired Consent Rate**
   - Consent forms expiring before renewal
   - Identifies process gaps

---

## 🎯 User Stories

### Case Manager

**As a case manager,**
- I want to release PHI only after obtaining client consent
- So that I maintain HIPAA compliance and protect client privacy

**Acceptance Criteria:**
- ✅ Cannot release PHI without uploaded consent form
- ✅ Can see PHI status at a glance
- ✅ Can revoke PHI access if needed
- ✅ Audit trail of all PHI releases

### Provider

**As a provider,**
- I want to know when I can access full client information
- So that I can prepare for service delivery appropriately

**Acceptance Criteria:**
- ✅ Clear indicator when PHI is not yet released
- ✅ Notification when PHI becomes available
- ✅ Restricted view until authorization
- ✅ Full access after PHI release

### Client (Indirect Benefit)

**As a client,**
- I want my information shared only when I've given consent
- So that my privacy is protected and I maintain control

**Acceptance Criteria:**
- ✅ PHI shared only with explicit consent
- ✅ Can revoke consent if needed (via case manager)
- ✅ Audit trail of who accessed my information

---

## 🔄 Future Enhancements

### Phase 2 Features:

1. **Consent Form Expiration Alerts**
   - Auto-notify case manager 30 days before expiration
   - Auto-revoke PHI access when consent expires

2. **Granular PHI Control**
   ```typescript
   phiReleased: {
     at: Date,
     byMemberId: string,
     scope: {
       medicalHistory: true,
       medications: true,
       diagnosis: true,
       contactInfo: true,
       financialInfo: false
     }
   }
   ```

3. **Client Self-Service**
   - Client portal to view who has PHI access
   - Client can revoke consent directly
   - Client can download audit log

4. **Time-Limited Access**
   ```typescript
   phiReleased: {
     at: Date,
     byMemberId: string,
     expiresAt: Date  // Auto-revoke after date
   }
   ```

5. **Multi-Provider Consent**
   - Single consent for multiple related providers
   - Network consent for coordinated care

---

## 📚 Related Documentation

- [HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/index.html)
- [Minimum Necessary Standard](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/minimum-necessary-requirement/index.html)
- [ROI Best Practices](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/disclosures-treatment-payment-health-care-operations/index.html)

---

## 🤝 Support & Questions

For questions about PHI release workflow:
- Technical: See `Referra_Data_Model_v1.1.md`
- Compliance: Consult HIPAA compliance officer
- Implementation: Contact development team

---

**Last Updated:** January 23, 2025  
**Status:** Partially Implemented (Display only, release functionality pending)  
**Priority:** High (HIPAA Compliance Critical)


