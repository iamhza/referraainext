# 🎯 **FINALIZED USER FLOWS - REFERRA PLATFORM**

## **📋 OVERVIEW**

This document maps out the **complete, actual user flows** based on the implemented features in the Referra platform. Each role has specific paths through the application designed to achieve their core objectives.

---

## **🏢 ORGANIZATIONAL HIERARCHY**

```
Platform Admin (sulemanhs@gmail.com)
    ↓
Organization: TruWell MN
    ├── Org Admin (admin@truwellmn.com)
    ├── Supervisor (supervisor@truwellmn.com)
    └── Case Managers (miknabil@yahoo.com, etc.)

Independent Providers (dannyghost@gmail.com, etc.)
```

---

## **1. 🔐 AUTHENTICATION FLOW (All Users)**

### **A. Sign In Process**
```
Landing Page (/) 
    → Click "Sign In"
    → Auth Page (/auth/signin)
    → Enter email/password
    → Role-Based Redirect:
        • platform_admin → /admin
        • org_admin → /org-admin  
        • supervisor → /supervisor
        • case_manager → /case-manager
        • provider → /provider
```

### **B. Sign Up Process**
```
Landing Page (/)
    → Click "Start Managing" (Case Manager)
    → Click "Join Network" (Provider)
    → Auth Page (/auth/signup)
    → Fill registration form
    → Account creation
```

### **C. Invitation Flow**
```
Email Invitation
    → Click invitation link
    → Accept Invitation Page (/invite/[token])
    → Set password
    → Complete profile
    → Auto-redirect to role dashboard
```

---

## **2. 👤 CASE MANAGER WORKFLOW**

### **A. Daily Starting Point**
```
Login → Case Manager Dashboard (/case-manager)
    • Board View: Three columns (Active-Stable, Active-Frustrated, Unplaced)
    • Client cards with status indicators
    • Quick Actions Bar (Request Updates, Generate Report)
    • Real-time workspace status indicators
```

### **B. Core Client Management Flow**
```
Dashboard → Click Client Card → Side Drawer Opens
    Tabs Available:
    • Overview: Basic client info
    • Timeline: Activity history  
    • Tasks: Action items
    • Communications: Messages/updates
    • Connections: Provider relationships
```

### **C. Client Operations**
```
1. VIEW ALL CLIENTS
   Dashboard → Switch to Table View (/case-manager/clients)
   • Search and filter clients
   • Bulk operations
   • Export capabilities

2. ADD NEW CLIENT  
   Dashboard → "Add Client" → New Client Form (/case-manager/clients/new)
   • Personal information
   • Service needs assessment
   • Emergency contacts
   • Medical information

3. EDIT CLIENT
   Client Card → Edit Button → Edit Form (/case-manager/clients/[id]/edit)
   • Update all client information
   • Change status and urgency
   • Add notes and updates
```

### **D. Referral Management Flow**
```
1. CREATE REFERRAL
   Dashboard → "New Referral" (/case-manager/new-referral)
   OR Client Card → "Create Referral"
   • Select client
   • Choose service type
   • Set urgency and requirements
   • Submit for matching

2. TRACK REFERRALS
   Navigation → Referrals (/case-manager/referrals)
   • View all referrals by status
   • Filter by client, provider, date
   • Track progress and updates

3. MANAGE ACTIVE REFERRAL
   Referrals → Click Referral → Detail View (/case-manager/referrals/[id])
   • View referral details
   • Provider information
   • Status updates
   • Communication history

4. REFERRAL WORKSPACE
   Referral Details → "Workspace" (/case-manager/referrals/[id]/workspace)
   • Real-time messaging with provider
   • Categorized communication (status_update, follow_up_required, etc.)
   • Document sharing
   • Progress tracking
```

### **E. Communication & Updates**
```
1. REQUEST UPDATES (Multiple Ways)
   • Dashboard Quick Actions → "Request Updates" (bulk)
   • Client Card → "Request Update" (individual)
   • Both create real workspace messages

2. WORKSPACE HUB
   Navigation → Workspace (/case-manager/workspace)
   • Central communication hub
   • All active conversations
   • Unread message indicators
   • Search and filter conversations

3. SPLIT WORKSPACE VIEW
   Workspace → Split View (/case-manager/workspace/split)
   • Multiple conversations side-by-side
   • Enhanced productivity view
```

### **F. Settings & Profile**
```
Navigation → Settings (/case-manager/settings)
• Personal profile
• Organization information
• Notification preferences  
• Security settings
```

---

## **3. 🏥 PROVIDER WORKFLOW**

### **A. Provider Dashboard**
```
Login → Provider Dashboard (/provider)
• Active referrals overview
• Pending actions
• Recent messages
• Capacity status
• Quick statistics
```

### **B. Referral Management**
```
1. VIEW INCOMING REFERRALS
   Navigation → Referrals (/provider/referrals)
   • New referrals requiring response
   • Filter by status and date
   • Accept/decline options

2. REFERRAL DETAILS
   Referrals → Click Referral (/provider/referrals/[id])
   • Client information (after acceptance)
   • Service requirements
   • Case manager contact
   • Status and timeline

3. REFERRAL WORKSPACE
   Referral → "Workspace" (/provider/referrals/[id]/workspace)
   • Direct communication with case manager
   • Submit status updates
   • Request information
   • Document uploads
```

### **C. Client Management (Post-Acceptance)**
```
1. CLIENT LIST
   Navigation → Clients (/provider/clients)
   • All assigned clients
   • Service status overview
   • Quick actions

2. CLIENT DETAILS
   Clients → Click Client (/provider/clients/[id])
   • Detailed client information
   • Service history
   • Communication log
   • Update status
```

### **D. Business Operations**
```
1. CAPACITY MANAGEMENT
   Navigation → Capacity (/provider/capacity)
   • Current caseload
   • Availability settings
   • Service type capacity

2. PROFILE MANAGEMENT
   Navigation → Profile (/provider/profile)
   • Business information
   • Service offerings
   • Credentials and certifications

3. NETWORK VIEW
   Navigation → Network (/provider/network)
   • Other providers in network
   • Collaboration opportunities
   • Referral sharing

4. NOTIFICATIONS
   Navigation → Notifications (/provider/notifications)
   • Update requests from case managers
   • System notifications
   • Message alerts
   • Priority indicators
```

### **E. Workspace Communication**
```
Navigation → Workspace (/provider/workspace)
• Central messaging hub
• All case manager conversations
• Unread indicators
• Quick responses
```

---

## **4. 👔 SUPERVISOR WORKFLOW**

### **A. Supervisor Dashboard**
```
Login → Supervisor Dashboard (/supervisor)
• Team overview
• Case manager performance
• Client assignment status
• Pending tasks
```

### **B. Team Management**
```
1. INVITE CASE MANAGERS
   Navigation → Invite Case Managers (/supervisor/invite)
   • Send invitation emails
   • Set roles and permissions
   • Track invitation status

2. MANAGE TEAM
   Navigation → Team Members (/supervisor/team)
   • View all team members
   • Performance metrics
   • Assign/reassign clients
   • Team communication

3. CLIENT ASSIGNMENTS
   Navigation → Client Assignments (/supervisor/assignments)
   • View all team clients
   • Reassign clients between case managers
   • Balance caseloads
   • Monitor workload
```

### **C. Analytics & Reporting**
```
Navigation → Team Analytics (/supervisor/analytics)
• Team performance metrics
• Client outcome tracking
• Referral success rates
• Response time analytics
```

---

## **5. 🏢 ORG ADMIN WORKFLOW**

### **A. Organizational Dashboard**
```
Login → Org Admin Dashboard (/org-admin)
• Real organization statistics (connected to API)
• User counts and activity
• Client and referral metrics
• System health indicators
```

### **B. User Management**
```
1. VIEW USERS
   Navigation → Users (/org-admin/users)
   • All organization users
   • Role assignments
   • Activity status
   • User permissions

2. MANAGE INVITATIONS
   Navigation → Invitations (/org-admin/invitations)
   • Invite new users (supervisors, case managers)
   • Track invitation status
   • Resend/cancel invitations
   • Bulk invitation management

3. TEAM STRUCTURE
   Navigation → Teams (/org-admin/teams)
   • Organizational structure
   • Team assignments
   • Hierarchy management
```

### **C. Client & Data Management**
```
1. CLIENT OVERSIGHT
   Navigation → Clients (/org-admin/clients)
   • All organization clients
   • Bulk operations
   • Data export/import
   • Quality assurance

2. CREATE CLIENTS
   Clients → "Add Client" (/org-admin/clients/new)
   • Org-wide client creation
   • Assign to case managers
   • Set priorities
```

### **D. Settings & Compliance**
```
1. ORGANIZATION SETTINGS
   Navigation → Settings (/org-admin/settings)
   • Organization profile
   • Branding and customization
   • Security policies
   • Workflow configuration

2. AUDIT LOGS
   Navigation → Audit Logs (/org-admin/audit)
   • HIPAA compliance tracking
   • User activity logs
   • System access records
   • Export capabilities

3. ANALYTICS
   Navigation → Analytics (/org-admin/analytics)
   • Organization-wide metrics
   • Performance dashboards
   • Outcome tracking
   • Custom reports
```

---

## **6. 🛠️ PLATFORM ADMIN WORKFLOW**

### **A. Platform Dashboard**
```
Login → Platform Admin Dashboard (/admin)
• System-wide metrics
• All organizations overview
• Platform health monitoring
• Critical alerts
```

### **B. System Management**
```
1. REFERRAL OVERSIGHT
   Navigation → Referrals (/admin/referrals)
   • All platform referrals
   • Manual matching
   • Issue resolution
   • Quality control

2. PROVIDER MANAGEMENT  
   Navigation → Providers (/admin/providers)
   • All platform providers
   • Approval workflows
   • Performance monitoring
   • Network optimization

3. USER ADMINISTRATION
   Navigation → Users (/admin/users)
   • All platform users
   • Role management
   • Account status
   • Support tools
```

### **C. Platform Operations**
```
1. ANALYTICS & REPORTING
   Navigation → Analytics (/admin/analytics)
   • Platform-wide metrics
   • Performance analytics
   • Usage statistics
   • Revenue tracking

2. SYSTEM TOOLS
   Navigation → Tools (/admin/tools)
   • Data cleanup utilities
   • Migration tools
   • Backup management
   • System maintenance

3. ACTIVITY MONITORING
   Navigation → Activity (/admin/activity)
   • Real-time system activity
   • User behavior tracking
   • Performance monitoring
   • Alert management
```

---

## **🔄 CORE INTEGRATION POINTS**

### **A. Workspace Messaging System**
- **Secure, HIPAA-compliant** encrypted messaging
- **Cross-role communication** (Case Manager ↔ Provider)
- **Real-time notifications** and status updates
- **Categorized messaging** (status_update, follow_up_required, etc.)

### **B. Update Request Flow**
```
Case Manager Dashboard → "Request Updates" 
    → Creates secure workspace message
    → Provider gets notification
    → Provider responds in workspace
    → Case Manager sees response indicators
```

### **C. Referral Lifecycle**
```
Case Manager creates referral
    → Admin matches with providers  
    → Provider accepts/declines
    → Active service delivery
    → Workspace communication throughout
    → Completion and outcome tracking
```

### **D. Organizational Hierarchy**
- **Data isolation** by org_id
- **Role-based permissions** and access control
- **Invitation-only** user management
- **Audit logging** for compliance

---

## **🎯 SUCCESS METRICS & KPIs**

### **Case Manager Success**
- Time to create referral: < 5 minutes
- Response time from providers: < 24 hours  
- Client status update frequency: Weekly minimum
- Successful placements: > 85%

### **Provider Success**
- Referral response time: < 4 hours
- Acceptance rate: > 60%
- Client outcome success: > 90%
- Communication responsiveness: < 2 hours

### **Organizational Success**
- User onboarding time: < 2 days
- Platform adoption rate: > 95%
- Data accuracy: > 98%
- Compliance audit success: 100%

---

## **🚀 PILOT ORGANIZATION READINESS**

### **✅ Ready for Pilot**
- Complete user flows for all roles
- Secure messaging and notifications
- Real API integration (no mock data)
- HIPAA-compliant data handling
- Role-based access control
- Organizational data isolation

### **📋 Pilot Onboarding Process**
1. **Org Admin setup** → Create organization
2. **Invite supervisors** → Team structure  
3. **Invite case managers** → User onboarding
4. **Import clients** → Data migration
5. **Connect providers** → Network building
6. **Training sessions** → User education
7. **Go live** → Full platform usage

**The platform is now PRODUCTION-READY for pilot organizations! 🎉**
