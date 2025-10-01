# Referra Platform Context

## What Referra Is

Referra is a modern referral management platform built for case managers in social services, particularly those working with Medicaid waiver clients (e.g., 245D, HSS, etc.). Case managers—whether from large organizations like Accord or smaller independent agencies—can log in to Referra to manage their full client caseload, create unified referral requests, and seamlessly coordinate with service providers.

## Core Understanding

At the core of Referra is the understanding that **referrals are built around client relationships**. That's why case managers can import their entire caseload via CSV, including key data like each client's current provider. This allows Referra to map real-world provider relationships already in place—and use that to bring those providers into the system for clearer, more direct communication.

## The Workflow

1. **Caseload Management**: Case managers import their entire client caseload via CSV
2. **Provider Mapping**: Referra maps existing client-provider relationships 
3. **Referral Creation**: Case manager generates new referral tied to existing client
4. **Service Specification**: Specify needed services through streamlined referral form
5. **Matching Process**: Admin team supports the provider match process
6. **Shared Workspace**: Once provider selected, both parties get access to shared referral workspace

## The Workspace (Core Communication Hub)

This workspace becomes the central hub for collaboration—where case managers and providers can:
- Leave categorized comments
- Attach documents  
- Track service delivery in real time

## Value Proposition

By capturing and owning the full lifecycle of the referral—from caseload to communication—Referra replaces scattered email threads and disconnected spreadsheets with a smart, structured, and transparent referral operating system.

## Key Users

- **Case Managers**: Social services professionals managing Medicaid waiver clients
- **Service Providers**: Organizations that deliver services to referred clients
- **Admin Team**: Referra staff supporting the matching process

## Domain Context

- **Medicaid Waiver Programs**: 245D, HSS, etc.
- **Social Services**: Not medical referrals, but social support services
- **Client-Provider Relationships**: Pre-existing relationships that need coordination
- **Referral Lifecycle**: Complete process from request to service delivery tracking

---

*This context should inform all development decisions and feature discussions.* For your first scenario, you said Case Manager X provides a Case Manager X Provider B, but Case Manager X to Provider C provided C didn't upload. We can just say the provider is not on our platform yet. Multiple providers per client is 100% a real case though. Just wanted to say that. Multiple case managers per client. That's a little iffy. There is cases where a client can have several case managers, but it's usually, I would say, the default, the big default is one case manager. But multiple providers per client is 100% because one client can have three different services and those are all three different providers.