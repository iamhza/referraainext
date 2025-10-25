# MVP Refactor Scope for Launch

We are preparing for launch and need to refactor the app to include only the most essential workflows to run the product and business. Eliminate or disable any extra features not directly supporting the following 3 user roles and workflows.

Keep only the following core flows:

---

## 1. Case Manager Workflow

* Login
* View caseload (list of clients)
* For each client:

  * View current provider
  * View status updates from provider
  * See referral history
* Submit a new referral (referral form) (new client or provider change)
* Receive a list of 3 matched providers from Admin 
* Pick and confirm one provider or request more matches
* Track service delivery through ongoing provider updates on each service for a client (client can have multiple services and multiple providers, keep this simple)

---

## 2. Provider Workflow

* Sign up (self-onboard)

  * Select service type(s) and or license type(245D, ARMHS..), contact info, person of contact , business info, 
  * Pay the monthly fee (199$) (via Square)
* Login
* View incoming referrals

  * Accept or reject
  * Once accepted, view full client info
* Submit ongoing status updates for assigned clients
* Upload documents (optional)

---

## 3. Admin Workflow

* Login
* View all referrals (new, pending, matched, closed)
* View all providers (active, pending approval, rejected)
* View all case managers and their activity
* For each referral:

  * Assign 3 matched providers manually
  * Send those options to the referring case manager
* Reassign if needed
* Monitor provider update activity per client
* Manually resolve escalations or broken communication

---

## Infrastructure/Business Requirements

* Use Square for provider payments during signup
* Require provider account approval before getting access to assigned referrals
* Enable simple 1-to-1 communication between matched provider and case manager, and then allow an admin to communicate really easily with provider or case manager

---

## Disable or Remove the Following:

* Messaging/chat UI
* Notifications unless critical
* AI matching logic (optional: simulate AI with human-in-loop)
* Tiered subscriptions (just use one plan via Square for now)
* Public-facing pages
* Searchable provider directory (for now)
* Any complex scheduling, reporting, or dashboards

---

