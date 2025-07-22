# ADMIN FLOW – REFERRA PLATFORM

This document outlines the core structure and features available to Admins within the Referra platform. Admins are responsible for monitoring referrals, maintaining provider and case manager quality, and ensuring the platform runs efficiently.

---

## 📊 Dashboard Page

**Metrics to Track:**
- **New Referrals**: Filterable view (Today, Last 7 days, Last Month, This Year)
- **Pending Matches**: Count of referrals still awaiting a provider match
- **Match Time (Avg)**: How long it's taking to match referrals
- **Referral Completion Rate**: % of referrals that reach “In Service” or “Completed” status
- **Referral Drop-Offs**: Referrals where the CM never selected a provider
- **Unresponsive Match Rate**:  
  \[
  (\text{Matches with No Provider Action} / \text{Total Matches Sent}) \times 100
  \]

---

## 📋 Referrals Page

**Queue Table View:**
- Client name or alias
- Service type
- Urgency level
- County
- "Match Now" action button
- Referral age (e.g., “Waiting 2 days”)
- Flags such as **"Needs Clarification"**

---

## 🧑‍⚕️ Case Manager & Provider Management

- View newly onboarded CMs and Providers
- Review profile activity and status
- Suspend, verify, or promote providers to new tiers

---

## 🛠️ Tools / Actions

- Add / edit provider tiers
- Manual referral creation
- View audit logs and system activity (see below)
- Tag providers with flags (e.g., “Slow response”, “Incomplete profile”)

---

## 🧾 Audit Logs / System Logs

Tracked for all key actions:

- **Timestamp**
- **User Role** (Admin, Provider, Case Manager)
- **Action Taken** (e.g., “Viewed Referral #4124”, “Updated Provider Tier”)
- **Optional:** IP address or device fingerprint (for traceability)

---

## 📝 Notes

- All admin changes to referrals, users, or settings should be logged.
- Logs are important for HIPAA-adjacent traceability, even if no PHI is handled.
- Consider auto-tagging referrals or providers based on system triggers (e.g., no action after X days).

---

Version: `v0.9 – Admin MVP Directive`  
Date: `July 2, 2025`  
Author: Referra Product Team
